export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { webhookUrl } = req.body;

  if (!webhookUrl) {
    return res.status(400).json({ error: 'webhookUrl é obrigatória' });
  }

  const timestamp = Date.now();
  const fakePayload = {
    order_id: `TESTE-${timestamp}`,
    status: "paid",
    external_reference: `TESTE-${timestamp}`,
    customer: {
      name: "Cliente Teste DiaLOG",
      email: "teste@dialog.com",
      phone: "+5511999999999",
      document: "12345678909"
    },
    shipping_address: {
      street: "Avenida Paulista",
      number: "1000",
      complement: "Apto 101",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      zipcode: "01310-100",
      country: "BR"
    },
    products: [
      { name: "Pod descartável Teste Vapex", price: 89.90, quantity: 1, weight: 0.1 }
    ],
    total: 89.90
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fakePayload),
    });

    const responseText = await response.text();

    return res.status(200).json({
      status: response.status,
      body: responseText
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      body: error.message || "Erro de rede no servidor"
    });
  }
}
