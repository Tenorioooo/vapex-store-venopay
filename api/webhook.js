import { createClient } from '@supabase/supabase-js';
import { sendDialogTracking } from './dialog.js';

const supabase = null; // Desativado conforme solicitação do cliente (não utiliza Supabase)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let data = req.body;

  // Realiza parse manual se for string
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error("Erro ao converter string do body para JSON:", e);
    }
  }

  // Realiza parse se for Buffer
  if (Buffer.isBuffer(data)) {
    try {
      data = JSON.parse(data.toString('utf-8'));
    } catch (e) {
      console.error("Erro ao converter Buffer do body para JSON:", e);
    }
  }

  // Garante que é um objeto utilizável
  if (!data || typeof data !== 'object') {
    data = {};
  }

  console.log("Webhook Veno recebido (Body):", JSON.stringify(data, null, 2));

  // Tenta pegar o ID do pedido de várias formas comuns em gateways
  const orderId = data.external_id || data.reference_id || data.reference || data.id || (data.data && (data.data.external_id || data.data.reference_id || data.data.id));
  const status = String(data.status || (data.data && data.data.status) || "").toLowerCase();
  const event = String(data.event || "").toLowerCase();

  // Verifica se o status indica pagamento aprovado de forma extremamente ampla
  const isPaid = 
    status === 'paid' || 
    status === 'approved' || 
    status === 'completed' || 
    status === 'succeeded' || 
    status === 'success' || 
    event === 'payment.succeeded' || 
    event === 'order.paid' || 
    event === 'transaction.paid' || 
    event === 'transaction.approved' || 
    event === 'order.approved' ||
    event === 'deposit.paid' ||
    event === 'pix.paid' ||
    event === 'pix.received' ||
    event === 'payment.paid';

  console.log(`Processando pedido: ${orderId} | Status: ${status} | Event: ${event} | Pago: ${isPaid}`);

  if (isPaid && orderId) {
    // Atualiza o status do pedido no Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'approved', payment_status: 'paid' })
          .eq('id', orderId);

        if (error) {
          console.error("Erro ao atualizar status do pedido no Supabase:", error);
        } else {
          console.log(`Pedido ${orderId} atualizado no Supabase com sucesso.`);
        }
      } catch (sbErr) {
        console.error("Erro na integração com o Supabase no Webhook:", sbErr);
      }
    }

    // Dispara webhook de rastreio para o DiaLOG Rastreios
    try {
      await sendDialogTracking(orderId, data);
    } catch (dialogErr) {
      console.error("Erro ao disparar webhook do DiaLOG:", dialogErr);
    }

    try {
      const utmifyToken = process.env.UTMIFY_TOKEN || 'sv1xSNuNzZsX0KSNewIqzrgQpVE4BUAczl4z';
      
      if (!utmifyToken) {
        console.warn("AVISO: UTMIFY_TOKEN não configurado no servidor. Envio para Utmify pulado.");
      } else {
        const amountInCents = data.data?.amount || data.amount || 0;
        const payer = data.data?.payer || data.payer || {};

        let rawPhone = (payer.phone || "").replace(/\D/g, "");
        if (rawPhone && !rawPhone.startsWith("55") && (rawPhone.length === 10 || rawPhone.length === 11)) {
          rawPhone = "55" + rawPhone;
        }
        const cleanCpf = (payer.document || payer.cpf || "").replace(/\D/g, "");

        // Somente enviar trackingParameters se ao menos um valor estiver presente para preservar UTMs originais do S2S
        const trackingParams = {};
        const utmSource = data.data?.utm_source || data.utm_source;
        const utmMedium = data.data?.utm_medium || data.utm_medium;
        const utmCampaign = data.data?.utm_campaign || data.utm_campaign;
        const utmContent = data.data?.utm_content || data.utm_content;
        const utmTerm = data.data?.utm_term || data.utm_term;
        const src = data.data?.src || data.src;
        const sck = data.data?.sck || data.sck;

        if (utmSource || utmMedium || utmCampaign || utmContent || utmTerm || src || sck) {
          trackingParams.utm_source = utmSource || null;
          trackingParams.utm_medium = utmMedium || null;
          trackingParams.utm_campaign = utmCampaign || null;
          trackingParams.utm_content = utmContent || null;
          trackingParams.utm_term = utmTerm || null;
          trackingParams.src = src || null;
          trackingParams.sck = sck || null;
        }

        const utmifyPayload = {
          orderId: orderId,
          status: "paid", // Utmify exige 'paid'
          createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
          approvedDate: new Date().toISOString().replace('T', ' ').split('.')[0],
          paymentMethod: "pix",
          platform: "VenoPayments",
          customer: {
            name: payer.name || "Cliente Vapex",
            email: payer.email || "contato@vapex.com",
            phone: rawPhone || undefined,
            document: cleanCpf || undefined,
            country: "BR"
          },
          products: [
            {
              id: "vapex-item",
              name: "Produto Vapex",
              planId: null,
              planName: null,
              quantity: 1,
              priceInCents: amountInCents
            }
          ],
          commission: {
            totalPriceInCents: amountInCents,
            gatewayFeeInCents: Math.round(amountInCents * 0.05),
            userCommissionInCents: Math.round(amountInCents * 0.95)
          }
        };

        if (Object.keys(trackingParams).length > 0) {
          utmifyPayload.trackingParameters = trackingParams;
        }

        console.log("Enviando Payload Completo para Utmify:", JSON.stringify(utmifyPayload, null, 2));

        const utmifyResponse = await fetch("https://api.utmify.com.br/api-credentials/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-token": utmifyToken
          },
          body: JSON.stringify(utmifyPayload)
        });

        const utmifyResult = await utmifyResponse.json().catch(() => ({}));
        console.log("Resultado Final Utmify:", utmifyResult);
      }
    } catch (error) {
      console.error("Erro ao processar webhook para Utmify:", error);
    }
  }

  // Sempre retornar 200 para a Veno não ficar tentando reenviar
  return res.status(200).json({ received: true });
}
