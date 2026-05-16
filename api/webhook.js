
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
    try {
      const utmifyToken = process.env.UTMIFY_TOKEN;
      
      if (utmifyToken) {
        const utmifyPayload = {
          orderId: orderId,
          status: "approved",
          approvedDate: new Date().toISOString().replace('T', ' ').split('.')[0],
          paymentMethod: "pix",
          platform: "VenoPayments"
        };

        console.log("Enviando para Utmify:", utmifyPayload);

        const utmifyResponse = await fetch("https://api.utmify.com.br/api-credentials/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-token": utmifyToken
          },
          body: JSON.stringify(utmifyPayload)
        });

        const utmifyResult = await utmifyResponse.json().catch(() => ({}));
        console.log("Resposta da Utmify no Webhook:", utmifyResult);
      }
    } catch (error) {
      console.error("Erro ao processar webhook para Utmify:", error);
    }
  }

  // Sempre retornar 200 para a Veno não ficar tentando reenviar
  return res.status(200).json({ received: true });
}
