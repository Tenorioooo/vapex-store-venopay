
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  console.log("Webhook Veno recebido:", data);

  // A Veno envia o status no campo 'status'. Se for 'paid' ou 'approved', confirmamos.
  const isPaid = data.status === 'paid' || data.status === 'approved' || data.event === 'payment.succeeded';

  if (isPaid) {
    try {
      const utmifyToken = process.env.UTMIFY_TOKEN;
      const orderId = data.external_id || data.reference_id;

      if (utmifyToken && orderId) {
        // Enviar atualização para Utmify
        const utmifyPayload = {
          orderId: orderId,
          status: "approved",
          approvedDate: new Date().toISOString().replace('T', ' ').split('.')[0],
          paymentMethod: "pix",
          platform: "VenoPayments"
        };

        const utmifyResponse = await fetch("https://api.utmify.com.br/api-credentials/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-token": utmifyToken
          },
          body: JSON.stringify(utmifyPayload)
        });

        const utmifyResult = await utmifyResponse.json().catch(() => ({}));
        console.log("Utmify Webhook Update:", utmifyResult);
      }
    } catch (error) {
      console.error("Erro ao processar webhook para Utmify:", error);
    }
  }

  // Sempre retornar 200 para a Veno não ficar tentando reenviar
  return res.status(200).json({ received: true });
}
