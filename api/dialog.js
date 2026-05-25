const supabase = null; // Desativado conforme solicitação do cliente (não utiliza Supabase)

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
  // Fallback seguro caso não configurado no env da Vercel
  return 'https://dnpgrcriaqpcybhzikvh.supabase.co/functions/v1/webhook-checkout/universal/1273b60a-4f1b-4ee0-9158-f0e91c081fdf';
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

export async function sendDialogTracking(orderId, webhookData = null) {
  // 1. Impedir duplo disparo (idempotência local se Supabase estiver ativo)
  if (supabase) {
    const alreadySent = await checkAlreadySent(orderId);
    if (alreadySent) {
      console.log(`[DiaLOG] Pedido ${orderId} já foi enviado anteriormente.`);
      return { success: true, message: "Already sent" };
    }
  }

  // 2. Obter URL do webhook externa
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) {
    console.error("[DiaLOG] DIALOG_WEBHOOK_URL não configurada.");
    return { success: false, error: "DIALOG_WEBHOOK_URL not configured" };
  }

  // 3. Montar payload do pedido
  let payload = null;

  if (supabase) {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('id', orderId)
        .maybeSingle();

      if (!fetchError && order) {
        const address = order.shipping_address || {};
        let rawPhone = (address.phone || order.phone || '').replace(/\D/g, '');
        if (rawPhone && !rawPhone.startsWith('55')) {
          rawPhone = '55' + rawPhone;
        }
        const phone = rawPhone ? '+' + rawPhone : '';
        const cleanCpf = (address.cpf || order.cpf || '').replace(/\D/g, '');

        payload = {
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
      }
    } catch (e) {
      console.error("[DiaLOG] Erro ao buscar pedido no Supabase:", e);
    }
  }

  // Fallback: usar dados da requisição do webhook (VenoPayments) caso o Supabase não esteja disponível/conectado
  if (!payload && webhookData) {
    const payer = webhookData.data?.payer || webhookData.payer || {};
    const address = webhookData.data?.address || webhookData.address || {};
    const amountInCents = webhookData.data?.amount || webhookData.amount || 0;

    let rawPhone = (payer.phone || '').replace(/\D/g, '');
    if (rawPhone && !rawPhone.startsWith('55')) {
      rawPhone = '55' + rawPhone;
    }
    const phone = rawPhone ? '+' + rawPhone : '';
    const cleanCpf = (payer.document || payer.cpf || '').replace(/\D/g, '');

    payload = {
      order_id: orderId,
      status: "paid",
      external_reference: orderId,
      customer: {
        name: payer.name || "Cliente Vapex",
        email: payer.email || "contato@vapex.com",
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
        zipcode: address.cep || address.zipcode || "",
        country: "BR"
      },
      products: [
        {
          name: "Produto Vapex",
          price: Number(amountInCents) / 100,
          quantity: 1,
          weight: 0.1
        }
      ],
      total: Number(amountInCents) / 100
    };
  }

  if (!payload) {
    console.error("[DiaLOG] Não foi possível compilar dados do pedido para envio.");
    return { success: false, error: "Order details missing" };
  }

  // 4. Enviar requisição com lógica de retentativas
  console.log(`[DiaLOG] Enviando webhook para o pedido ${orderId}...`);
  const result = await sendRequestWithRetry(webhookUrl, payload);

  // 5. Registrar resposta na tabela de logs se o banco estiver disponível
  if (supabase) {
    await logResponse(orderId, result.status, result.body);
  }

  if (result.status >= 200 && result.status < 300) {
    console.log(`[DiaLOG] Rastreio do pedido ${orderId} enviado com sucesso!`);
    return { success: true, status: result.status };
  } else {
    console.error(`[DiaLOG] Falha ao enviar rastreio do pedido ${orderId} (Status ${result.status})`);
    return { success: false, status: result.status, error: result.body };
  }
}
