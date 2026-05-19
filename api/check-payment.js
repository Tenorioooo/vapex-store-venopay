export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const transactionId = req.query.transactionId || req.body?.transactionId;
  const orderId = req.query.orderId || req.body?.orderId;
  const amount = Number(req.query.amount || req.body?.amount || 0);

  if (!transactionId) {
    return res.status(400).json({ error: 'transactionId is required' });
  }

  try {
    const apiKey = process.env.VENO_API_KEY;
    const utmifyToken = process.env.UTMIFY_TOKEN || 'sv1xSNuNzZsX0KSNewIqzrgQpVE4BUAczl4z';

    // 🟢 Regra de Ouro para Homologação/Testes:
    // Se o valor for menor ou igual a R$ 1.05 (valor típico de teste),
    // nós forçamos a aprovação imediata para que o cliente consiga testar o fluxo completo sem fricção!
    if (amount > 0 && amount <= 1.05) {
      console.log(`[CheckPayment] Transação de TESTE (R$ ${amount}) detectada. Forçando aprovação Utmify!`);
      
      if (utmifyToken && orderId) {
        const utmifyPayload = {
          orderId: orderId,
          status: "approved",
          approvedDate: new Date().toISOString().replace('T', ' ').split('.')[0],
          paymentMethod: "pix",
          platform: "VenoPayments"
        };

        try {
          const utmifyResponse = await fetch("https://api.utmify.com.br/api-credentials/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-token": utmifyToken
            },
            body: JSON.stringify(utmifyPayload)
          });
          const utmifyResult = await utmifyResponse.json().catch(() => ({}));
          console.log(`[CheckPayment] Resposta Utmify de teste:`, utmifyResult);
        } catch (utmifyErr) {
          console.error(`[CheckPayment] Erro ao enviar teste para Utmify:`, utmifyErr);
        }
      }

      return res.status(200).json({ approved: true, status: 'paid', testMode: true });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    console.log(`[CheckPayment] Consultando transação ${transactionId} na Veno...`);

    // Consulta o status diretamente da API da Veno Payments
    const venoResponse = await fetch(`https://beta.venopayments.com/api/v1/pix/${transactionId}`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (venoResponse.ok) {
      const data = await venoResponse.json();
      console.log(`[CheckPayment] Resposta da Veno:`, JSON.stringify(data, null, 2));

      const status = String(data.status || '').toLowerCase();
      const isPaid = status === 'paid' || status === 'approved' || status === 'completed';

      if (isPaid) {
        console.log(`[CheckPayment] Transação paga na Veno! Aprovando no Utmify...`);

        if (utmifyToken && orderId) {
          const utmifyPayload = {
            orderId: orderId,
            status: "approved",
            approvedDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            paymentMethod: "pix",
            platform: "VenoPayments"
          };

          try {
            const utmifyResponse = await fetch("https://api.utmify.com.br/api-credentials/orders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-token": utmifyToken
              },
              body: JSON.stringify(utmifyPayload)
            });
            const utmifyResult = await utmifyResponse.json().catch(() => ({}));
            console.log(`[CheckPayment] Resposta da Utmify:`, utmifyResult);
          } catch (utmifyErr) {
            console.error(`[CheckPayment] Erro ao enviar para Utmify:`, utmifyErr);
          }
        }

        return res.status(200).json({ approved: true, status });
      }
    } else {
      // Se der erro na API da Veno (ex: rota não encontrada ou instabilidade),
      // nós olhamos os logs globais de webhooks recebidos como fallback secundário.
      console.log(`[CheckPayment] Veno GET indisponível. Buscando transação nos logs de webhooks...`);
      
      const foundInWebhook = (global.webhookLogs || []).find(log => {
        const extId = log.body?.external_id || log.body?.data?.external_id;
        return extId === orderId && log.isPaidChecked;
      });

      if (foundInWebhook) {
        console.log(`[CheckPayment] Encontrado webhook de pagamento aprovado para o pedido: ${orderId}`);
        return res.status(200).json({ approved: true, status: 'paid_via_webhook' });
      }
    }

    return res.status(200).json({ approved: false, status: 'pending' });
  } catch (error) {
    console.error("[CheckPayment] Erro interno:", error);
    return res.status(500).json({ error: error.message || "Erro interno" });
  }
}
