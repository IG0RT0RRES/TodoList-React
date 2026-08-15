import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('A chave STRIPE_SECRET_KEY não foi configurada nas variáveis de ambiente.');
    }

    const { matricula, nome, whatsapp, email, cupom } = req.body || {};

    if (!matricula || !nome || !whatsapp || !email) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // 🔍 1. Buscar se já existe um cliente cadastrado no Stripe com este e-mail
    const existingCustomers = await stripe.customers.list({
      email: email.trim(),
      limit: 1,
    });

    let customerId;

    if (existingCustomers.data.length > 0) {
      // Se já existe, reaproveita o ID do cliente existente no Stripe
      customerId = existingCustomers.data[0].id;
    } else {
      // Se não existe, cria um novo cliente no Stripe
      const newCustomer = await stripe.customers.create({
        email: email.trim(),
        name: nome.trim(),
        phone: whatsapp.trim(),
        metadata: {
          matricula: matricula.trim(),
        },
      });
      customerId = newCustomer.id;
    }

    // 🎟️ 2. Criação da Checkout Session vinculada ao Customer ID fixo
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      customer: customerId, // Vincula ao cliente oficial do Stripe (Essencial para a regra de 1º pedido funcionar!)
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Licença de Acesso - Gestor de Baixas',
              description: `Ativação para a matrícula ${matricula}`,
            },
            unit_amount: 1500, // R$ 15,00 em centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',

      // Habilita o campo de cupom no checkout
      allow_promotion_codes: true,

      success_url: `https://wa.me/5521969254192?text=Pagamento%20realizado%20com%20sucesso!%20Matricula:%20${encodeURIComponent(matricula)}`,
      cancel_url: `https://wa.me/5521969254192?text=O%20pagamento%20da%20licenca%20foi%20cancelado.`,
      metadata: {
        matricula,
        nome,
        whatsapp,
        email,
        cupom: cupom || 'nenhum',
      },
    });

    return res.status(200).json({
      checkout_url: session.url
    });

  } catch (error) {
    console.error('Erro no Stripe Checkout:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor ao criar o Checkout.' });
  }
}
