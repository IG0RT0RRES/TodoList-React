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

    const { matricula, nome, whatsapp, email } = req.body;

    if (!matricula || !nome || !whatsapp || !email) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // Criação da Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'], // Adicione outros métodos se ativados no Dashboard
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Licença de Acesso - Gestor de Baixas',
              description: `Ativação para a matrícula ${matricula}`,
            },
            unit_amount: 1000, // R$ 10,00 em centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      // URLs para redirecionamento após o pagamento
      success_url: 'https://checkout.stripe.dev/success',
      cancel_url: 'https://checkout.stripe.dev/cancel',
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
