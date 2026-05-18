import { createClient } from '@supabase/supabase-js';
import { sendDialogTracking } from './dialog.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  console.log("Webhook Veno recebido (Body):", JSON.stringify(data, null, 2));

  // Tenta pegar o ID do pedido de várias formas comuns em gateways
  const orderId = data.external_id || data.reference_id || (data.data && data.data.external_id);
  const status = (data.status || (data.data && data.data.status) || "").toLowerCase();
  const event = (data.event || "").toLowerCase();

  // Verifica se o status indica pagamento (paid, approved, payment.succeeded, etc)
  const isPaid = status === 'paid' || status === 'approved' || event === 'payment.succeeded' || event === 'order.paid';

  console.log(`Processando pedido: ${orderId} | Status: ${status} | Pago: ${isPaid}`);

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
      await sendDialogTracking(orderId);
    } catch (dialogErr) {
      console.error("Erro ao disparar webhook do DiaLOG:", dialogErr);
    }

    try {
      const utmifyToken = process.env.UTMIFY_TOKEN;
      
      if (!utmifyToken) {
        console.error("ERRO CRÍTICO: UTMIFY_TOKEN não encontrado!");
        return res.status(500).json({ error: "Token missing" });
      }

      const amountInCents = data.data?.amount || data.amount || 0;
      const payer = data.data?.payer || data.payer || {};

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
          phone: (payer.phone || "").replace(/\D/g, ""),
          document: (payer.document || "").replace(/\D/g, ""),
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
        trackingParameters: {
          utm_source: data.utm_source || "",
          utm_medium: data.utm_medium || "",
          utm_campaign: data.utm_campaign || "",
          utm_content: data.utm_content || "",
          utm_term: data.utm_term || ""
        },
        commission: {
          totalPriceInCents: amountInCents,
          gatewayFeeInCents: Math.round(amountInCents * 0.05),
          userCommissionInCents: Math.round(amountInCents * 0.95)
        }
      };

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
    } catch (error) {
      console.error("Erro ao processar webhook para Utmify:", error);
    }
  }

  // Sempre retornar 200 para a Veno não ficar tentando reenviar
  return res.status(200).json({ received: true });
}
