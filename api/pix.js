
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, cpf, email, phone, amount, productName, referenceId, trackingParameters } = req.body;

  try {
    const apiKey = process.env.VENO_API_KEY;
    const utmifyToken = process.env.UTMIFY_TOKEN || 'sv1xSNuNzZsX0KSNewIqzrgQpVE4BUAczl4z';

    if (!apiKey) {
      return res.status(500).json({ error: 'Erro de configuração do servidor (Veno API Key não encontrada)' });
    }

    const orderReference = referenceId || `PEDIDO-${Date.now()}`;
    const amountInCents = Math.round(amount * 100);

    let rawPhone = phone ? phone.replace(/\D/g, "") : "";
    if (rawPhone && !rawPhone.startsWith("55") && (rawPhone.length === 10 || rawPhone.length === 11)) {
      rawPhone = "55" + rawPhone;
    }
    const cleanCpf = cpf ? cpf.replace(/\D/g, "") : "";

    // Prepara chamadas em paralelo para evitar Timeout na Vercel (10s limit)
    const promises = [];

    // 1. Promise do Utmify
    if (utmifyToken) {
      const utmifyPayload = {
        orderId: orderReference,
        platform: "VenoPayments",
        paymentMethod: "pix",
        status: "waiting_payment",
        createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
        approvedDate: null,
        refundedAt: null,
        customer: {
          name: name || "Cliente Vapex",
          email: email || "cliente@vapex.com",
          phone: phone ? phone.replace(/\D/g, "") : "",
          document: cpf ? cpf.replace(/\D/g, "") : "",
          country: "BR"
        },
        products: [
          {
            id: productName || "vapex-item",
            name: productName || "Produto Vapex",
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: amountInCents
          }
        ],
        trackingParameters: {
          utm_source: trackingParameters?.utm_source || null,
          utm_medium: trackingParameters?.utm_medium || null,
          utm_campaign: trackingParameters?.utm_campaign || null,
          utm_content: trackingParameters?.utm_content || null,
          utm_term: trackingParameters?.utm_term || null,
          src: trackingParameters?.src || null,
          sck: trackingParameters?.sck || null
        },
        commission: {
          totalPriceInCents: amountInCents,
          gatewayFeeInCents: Math.round(amountInCents * 0.05),
          userCommissionInCents: Math.round(amountInCents * 0.95)
        },
        isTest: false
      };

      const utmifyPromise = fetch("https://api.utmify.com.br/api-credentials/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-token": utmifyToken },
        body: JSON.stringify(utmifyPayload)
      }).catch(e => console.error("Erro rede Utmify:", e));
      
      promises.push(utmifyPromise);
    }

    // 2. Promise do VenoPay
    // Garante que o callback de webhook sempre vá para o domínio de produção oficial para evitar desvios em URLs de preview/staging da Vercel
    const callbackUrl = 'https://vapexstore.vercel.app/api/webhook';

    const venoPayload = {
      amount: amountInCents,
      callback_url: callbackUrl,
      external_id: orderReference,
      description: (productName || "Pedido Vapex").substring(0, 100),
      payer: {
        name: name || "Cliente Vapex",
        email: email || "cliente@vapex.com",
        document: cpf ? cpf.replace(/\D/g, "") : "00000000000",
        phone: phone ? phone.replace(/\D/g, "") : "11999999999"
      },
      utm_source: trackingParameters?.utm_source || undefined,
      utm_medium: trackingParameters?.utm_medium || undefined,
      utm_campaign: trackingParameters?.utm_campaign || undefined,
      utm_content: trackingParameters?.utm_content || undefined,
      utm_term: trackingParameters?.utm_term || undefined,
      src: trackingParameters?.src || undefined,
      sck: trackingParameters?.sck || undefined
    };

    const venoPromise = fetch("https://beta.venopayments.com/api/v1/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(venoPayload),
    });
    
    promises.push(venoPromise);

    // Executa ambas simultaneamente
    const results = await Promise.allSettled(promises);
    
    // O último item no array promises é sempre o VenoPay
    const venoResult = results[results.length - 1];
    
    if (venoResult.status === 'rejected') {
      throw new Error("Falha na requisição para VenoPay: " + venoResult.reason);
    }

    const response = venoResult.value;
    const responseData = await response.json();

    if (response.ok && responseData.id) {
      const emvCode = responseData.pix_copy_paste || responseData.qr_code;
      const qrImage = responseData.qr_code_image && (responseData.qr_code_image.startsWith('http') || responseData.qr_code_image.startsWith('data:image')) 
        ? responseData.qr_code_image 
        : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(emvCode)}`;

      return res.status(200).json({
        status: "success",
        transaction_id: responseData.id,
        reference: responseData.external_id || orderReference,
        pix_code: emvCode,
        pix_qr_code: qrImage,
        amount: amount,
        expires_at: responseData.expires_at,
      });
    } else {
      console.error("Erro na resposta da Veno Payments:", responseData);
      return res.status(400).json({
        error: responseData.message || responseData.error || "Falha ao processar o pagamento com Veno"
      });
    }
  } catch (error) {
    console.error("Erro interno na API de PIX (Veno):", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor" });
  }
}
