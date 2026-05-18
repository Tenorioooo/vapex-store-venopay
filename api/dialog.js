import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function getWebhookUrl() {
  if (process.env.DIALOG_WEBHOOK_URL) {
    return process.env.DIALOG_WEBHOOK_URL;
  }
  
  if (supabase) {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'DIALOG_WEBHOOK_URL')
        .maybeSingle();
        
      if (data) return data.value;
    } catch (e) {
      console.error("[DiaLOG] Erro ao buscar URL de webhook nas configurações:", e);
    }
  }
  return null;
}

async function checkAlreadySent(orderId) {
  if (!supabase) return false;
  
  try {
    const { data } = await supabase
      .from('dialog_webhook_logs')
      .select('id')
      .eq('order_id', orderId)
      .lt('status_code', 300)
      .maybeSingle();
      
    return !!data;
  } catch (e) {
    console.error("[DiaLOG] Erro ao verificar logs de duplicidade:", e);
    return false;
  }
}

async function logResponse(orderId, statusCode, responseBody) {
  if (!supabase) return;
  
  try {
    await supabase.from('dialog_webhook_logs').insert({
      order_id: orderId,
      status_code: statusCode,
      response_body: responseBody || "",
      sent_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("[DiaLOG] Erro ao gravar log do webhook no Supabase:", error);
  }
}

async function sendRequestWithRetry(url, payload, maxRetries = 3) {
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      
      if (response.status >= 500) {
        attempt++;
        if (attempt >= maxRetries) {
          return { status: response.status, body: responseText };
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        return { status: response.status, body: responseText };
      }
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        return { status: 599, body: error.message || "Network Error" };
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

export async function sendDialogTracking(orderId) {
  if (!supabase) {
    console.error("[DiaLOG] Supabase client não configurado.");
    return { success: false, error: "Supabase not configured" };
  }

  // 1. Impedir duplo disparo (idempotência local)
  const alreadySent = await checkAlreadySent(orderId);
  if (alreadySent) {
    console.log(`[DiaLOG] Pedido ${orderId} já foi enviado anteriormente.`);
    return { success: true, message: "Already sent" };
  }

  // 2. Buscar detalhes do pedido no Supabase
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(*))')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchError || !order) {
    console.error(`[DiaLOG] Erro ao buscar pedido ${orderId}:`, fetchError);
    return { success: false, error: fetchError?.message || "Order not found" };
  }

  // 3. Obter URL do webhook externa
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) {
    console.error("[DiaLOG] DIALOG_WEBHOOK_URL não configurada.");
    return { success: false, error: "DIALOG_WEBHOOK_URL not configured" };
  }

  // 4. Formatar payload para DiaLOG
  const address = order.shipping_address || {};
  
  let rawPhone = (address.phone || order.phone || '').replace(/\D/g, '');
  if (rawPhone && !rawPhone.startsWith('55')) {
    rawPhone = '55' + rawPhone;
  }
  const phone = rawPhone ? '+' + rawPhone : '';

  const cleanCpf = (address.cpf || order.cpf || '').replace(/\D/g, '');

  const payload = {
    order_id: order.id,
    status: "paid",
    external_reference: order.id,
    customer: {
      name: address.name || "Cliente Vapex",
      email: address.email || order.email || "contato@vapex.com",
      phone: phone,
      document: cleanCpf
    },
    shipping_address: {
      street: address.street || "",
      number: String(address.number || ""),
      complement: address.complement || "",
      neighborhood: address.neighborhood || "",
      city: address.city || "",
      state: address.state || "",
      zipcode: address.cep || "",
      country: "BR"
    },
    products: (order.order_items || []).map(item => ({
      name: item.product?.name || "Produto Vapex",
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      weight: 0.1
    })),
    total: Number(order.total || 0)
  };

  // 5. Enviar requisição com lógica de retentativas
  console.log(`[DiaLOG] Enviando webhook para o pedido ${order.id}...`);
  const result = await sendRequestWithRetry(webhookUrl, payload);

  // 6. Registrar resposta na tabela de logs para auditoria
  await logResponse(order.id, result.status, result.body);

  if (result.status >= 200 && result.status < 300) {
    console.log(`[DiaLOG] Rastreio do pedido ${order.id} enviado com sucesso!`);
    return { success: true, status: result.status };
  } else {
    console.error(`[DiaLOG] Falha ao enviar rastreio do pedido ${order.id} (Status ${result.status})`);
    return { success: false, status: result.status, error: result.body };
  }
}
