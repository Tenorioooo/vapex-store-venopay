import fs from 'fs';
import path from 'path';

// Configurações padrão
const UTMIFY_TOKEN = 'sv1xSNuNzZsX0KSNewIqzrgQpVE4BUAczl4z';

// Tenta ler o token do arquivo .env local se ele existir
let token = UTMIFY_TOKEN;
try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/UTMIFY_TOKEN\s*=\s*(.+)/);
    if (match && match[1]) {
      token = match[1].trim();
    }
  }
} catch (e) {
  console.log("Aviso: Não foi possível ler o arquivo .env, usando o token padrão.");
}

// Lista de nomes e dados fictícios para simular compradores reais
const mockBuyers = [
  { name: "Guilherme Santos", email: "guilherme.santos@gmail.com", phone: "5511988887777", cpf: "44433322211" },
  { name: "Beatriz Oliveira", email: "beatriz.oliveira@outlook.com", phone: "5521977776666", cpf: "33322211100" },
  { name: "Lucas Pereira", email: "lucas.pereira@yahoo.com.br", phone: "5531966665555", cpf: "22211100099" },
  { name: "Mariana Souza", email: "mariana.souza@gmail.com", phone: "5541955554444", cpf: "11100099988" },
  { name: "Thiago Lima", email: "thiago.lima@hotmail.com", phone: "5519944443333", cpf: "00099988877" },
  { name: "Camila Costa", email: "camila.costa@gmail.com", phone: "5511933332222", cpf: "99988877766" },
  { name: "Felipe Rodrigues", email: "felipe.rodriguez@gmail.com", phone: "5581922221111", cpf: "88877766655" }
];

const products = [
  { id: "vapex-classic", name: "Vapex Classic Pro", price: 149.90 },
  { id: "vapex-max", name: "Vapex Max Turbo", price: 299.90 },
  { id: "vapex-mini", name: "Vapex Mini Pocket", price: 89.90 }
];

/**
 * Função para disparar uma venda para a Utmify
 */
async function sendMockSale(buyer, product, index) {
  const orderId = `SIM-SALE-${Date.now()}-${index}`;
  const amountInCents = Math.round(product.price * 100);

  const utmifyPayload = {
    orderId: orderId,
    status: "paid",
    createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
    approvedDate: new Date().toISOString().replace('T', ' ').split('.')[0],
    paymentMethod: "pix",
    platform: "VenoPayments",
    customer: {
      name: buyer.name,
      email: buyer.email,
      phone: buyer.phone,
      document: buyer.cpf,
      country: "BR"
    },
    products: [
      {
        id: product.id,
        name: product.name,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: amountInCents
      }
    ],
    trackingParameters: {
      utm_source: "google_ads",
      utm_medium: "cpc",
      utm_campaign: "simulation_campaign",
      utm_content: "ad_version_1",
      utm_term: "vape store"
    },
    commission: {
      totalPriceInCents: amountInCents,
      gatewayFeeInCents: Math.round(amountInCents * 0.05),
      userCommissionInCents: Math.round(amountInCents * 0.95)
    }
  };

  try {
    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token
      },
      body: JSON.stringify(utmifyPayload)
    });

    const result = await response.json().catch(() => ({}));
    console.log(`[Venda #${index}] Enviada: ${buyer.name} comprou ${product.name} (R$ ${product.price})`);
    console.log(` -> Resposta Utmify:`, JSON.stringify(result));
    return true;
  } catch (error) {
    console.error(`[Venda #${index}] Erro ao enviar:`, error.message);
    return false;
  }
}

/**
 * Função Principal para disparar lote de vendas
 * @param {number} count - Quantidade de vendas a simular
 */
async function runMassTrigger(count = 5) {
  console.log(`========== INICIANDO SIMULADOR UTMIFY ==========`);
  console.log(`Token utilizado: ${token.substring(0, 8)}...`);
  console.log(`Quantidade de disparos solicitada: ${count}\n`);

  for (let i = 1; i <= count; i++) {
    // Escolhe dados aleatórios
    const buyer = mockBuyers[Math.floor(Math.random() * mockBuyers.length)];
    const product = products[Math.floor(Math.random() * products.length)];

    await sendMockSale(buyer, product, i);

    // Pequeno intervalo entre disparos para simular tempo real
    if (i < count) {
      const waitTime = 1000;
      console.log(`Aguardando ${waitTime}ms para o próximo disparo...\n`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  console.log(`\n========== SIMULAÇÃO CONCLUÍDA COM SUCESSO ==========`);
}

// Executa o disparo em massa (pode alterar o número de vendas aqui)
// Para rodar, use o comando: node mass-utmify-trigger.js
runMassTrigger(500);
