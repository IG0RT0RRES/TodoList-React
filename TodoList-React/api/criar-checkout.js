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

    const { matricula, nome, whatsapp, email } = req.body || {};

    if (!matricula || !nome || !whatsapp || !email) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // Criação da Checkout Session com o campo de cupom liberado
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Licença de Acesso - Gestor de Baixas',
              description: `Ativação para a matrícula ${matricula}`,
            },
            unit_amount: 1500, // R$ 10,00 em centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',

      // 🎟️ HABILITA O CAMPO DE CÓDIGO PROMOCIONAL/CUPOM NO CHECKOUT
      allow_promotion_codes: true,

      customer_email: email,
      success_url: `https://wa.me/5521969254192?text=Pagamento%20realizado%20com%20sucesso!%20Matricula:%20${encodeURIComponent(matricula)}`,
      cancel_url: `https://wa.me/5521969254192?text=O%20pagamento%20da%20licenca%20foi%20cancelado.`,
      metadata: {
        matricula,
        nome,
        whatsapp,
        email,
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
