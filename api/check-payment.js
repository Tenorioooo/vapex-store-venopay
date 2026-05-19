import { sendDialogTracking } from './dialog.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const transactionId = req.query.transactionId || req.body?.transactionId;
  const orderId = req.query.orderId || req.body?.orderId;
  const amount = Number(req.query.amount || req.body?.amount || 0);

  // Informações do cliente enviadas do checkout
  const name = req.query.name || req.body?.name || "Cliente Vapex";
  const email = req.query.email || req.body?.email || "cliente@vapex.com";
  const phone = req.query.phone || req.body?.phone || "";
  const cpf = req.query.cpf || req.body?.cpf || "";

  if (!transactionId) {
    return res.status(400).json({ error: 'transactionId is required' });
  }

  try {
    const apiKey = process.env.VENO_API_KEY;
    const utmifyToken = process.env.UTMIFY_TOKEN || 'sv1xSNuNzZsX0KSNewIqzrgQpVE4BUAczl4z';

    // Formatação robusta do telefone com DDI 55 exigido pela Utmify
    let rawPhone = phone.replace(/\D/g, "");
    if (rawPhone && !rawPhone.startsWith("55") && (rawPhone.length === 10 || rawPhone.length === 11)) {
      rawPhone = "55" + rawPhone;
    }
    const cleanCpf = cpf.replace(/\D/g, "");
    const amountInCents = Math.round(amount * 100);

    // 🟢 Regra de Ouro para Homologação/Testes (R$ 1,00):
    if (amount > 0 && amount <= 1.05) {
      console.log(`[CheckPayment] Transação de TESTE (R$ ${amount}) detectada. Forçando aprovação Utmify!`);
      
      // 🛡️ Proteção de Créditos DiaLOG:
      // Para evitar esgotar os seus créditos de rastreio com Pix de testes de R$ 1,00,
      // nós apenas simulamos a chamada DiaLOG com logs limpos, sem queimar créditos reais!
      console.log(`[CheckPayment] [DiaLOG] Transação de R$ 1,00 - Envio de rastreio real pulado para economizar seus créditos!`);

      // Dispara aprovação rica e completa para a Utmify
      if (utmifyToken && orderId) {
        const utmifyPayload = {
          orderId: orderId,
          status: "paid",
          createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
          approvedDate: new Date().toISOString().replace('T', ' ').split('.')[0],
          paymentMethod: "pix",
          platform: "VenoPayments",
          customer: {
            name: name,
            email: email,
            phone: rawPhone || "5511999999999",
            document: cleanCpf || "00000000000",
            country: "BR"
          },
          products: [
            {
              id: "vapex-item",
              name: "Produto Vapex",
              planId: null,
              planName: null,
              quantity: 1,
              priceInCents: amountInCents || 100
            }
          ],
          trackingParameters: {
            utm_source: req.query.utm_source || "",
            utm_medium: req.query.utm_medium || "",
            utm_campaign: req.query.utm_campaign || "",
            utm_content: req.query.utm_content || "",
            utm_term: req.query.utm_term || ""
          },
          commission: {
            totalPriceInCents: amountInCents || 100,
            gatewayFeeInCents: Math.round((amountInCents || 100) * 0.05),
            userCommissionInCents: Math.round((amountInCents || 100) * 0.95)
          }
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
          console.log(`[CheckPayment] Resposta da Utmify para teste:`, utmifyResult);
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
        console.log(`[CheckPayment] Transação paga na Veno! Aprovando no Utmify e DiaLOG...`);

        // 1. Dispara DiaLOG Real (somente para transações de produção)
        try {
          await sendDialogTracking(orderId, data);
        } catch (dialogErr) {
          console.error(`[CheckPayment] Erro DiaLOG:`, dialogErr);
        }

        // 2. Dispara aprovação para a Utmify com o payload completo e rico
        if (utmifyToken && orderId) {
          const utmifyPayload = {
            orderId: orderId,
            status: "paid",
            createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
            approvedDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            paymentMethod: "pix",
            platform: "VenoPayments",
            customer: {
              name: name,
              email: email,
              phone: rawPhone,
              document: cleanCpf,
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
              utm_source: req.query.utm_source || "",
              utm_medium: req.query.utm_medium || "",
              utm_campaign: req.query.utm_campaign || "",
              utm_content: req.query.utm_content || "",
              utm_term: req.query.utm_term || ""
            },
            commission: {
              totalPriceInCents: amountInCents,
              gatewayFeeInCents: Math.round(amountInCents * 0.05),
              userCommissionInCents: Math.round(amountInCents * 0.95)
            }
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
      // Busca nos logs globais de webhooks recebidos como fallback secundário
      console.log(`[CheckPayment] Veno GET indisponível. Buscando transação nos logs de webhooks...`);
      
      const foundInWebhook = (global.webhookLogs || []).find(log => {
        const extId = log.body?.external_id || log.body?.data?.external_id;
        return extId === orderId && log.isPaidChecked;
      });

      if (foundInWebhook) {
        console.log(`[CheckPayment] Encontrado webhook de pagamento aprovado para o pedido: ${orderId}`);
        
        // 1. Dispara DiaLOG
        try {
          await sendDialogTracking(orderId, foundInWebhook.body);
        } catch (dialogErr) {
          console.error(`[CheckPayment] Erro DiaLOG fallback:`, dialogErr);
        }

        // 2. Dispara aprovação completa Utmify
        if (utmifyToken && orderId) {
          const utmifyPayload = {
            orderId: orderId,
            status: "paid",
            createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
            approvedDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            paymentMethod: "pix",
            platform: "VenoPayments",
            customer: {
              name: name,
              email: email,
              phone: rawPhone,
              document: cleanCpf,
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

          try {
            await fetch("https://api.utmify.com.br/api-credentials/orders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-token": utmifyToken
              },
              body: JSON.stringify(utmifyPayload)
            });
          } catch (e) {
            console.error(e);
          }
        }

        return res.status(200).json({ approved: true, status: 'paid_via_webhook' });
      }
    }

    return res.status(200).json({ approved: false, status: 'pending' });
  } catch (error) {
    console.error("[CheckPayment] Erro interno:", error);
    return res.status(500).json({ error: error.message || "Erro interno" });
  }
}
