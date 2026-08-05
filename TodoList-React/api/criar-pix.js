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
      throw new Error('A chave STRIPE_SECRET_KEY não foi configurada.');
    }

    const { matricula, nome, whatsapp, email } = req.body;

    if (!matricula || !nome || !whatsapp || !email) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // Criação do PaymentIntent PIX de forma confirmada
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // R$ 10,00
      currency: 'brl',
      payment_method_types: ['pix'], // 👈 Alterado de 'card' para 'pix'
      payment_method_data: {
        type: 'pix',
        billing_details: {
          name: nome,
          email: email,
        },
      },
      confirm: true, // 👈 Importante: confirma a criação para gerar o QR Code imediatamente
      receipt_email: email,
      metadata: { 
        matricula, 
        nome, 
        whatsapp, 
        email 
      }
    });

    const nextAction = paymentIntent.next_action;
    let pixCopiaECola = null;

    if (nextAction && nextAction.pix_display_qr_code) {
      pixCopiaECola = nextAction.pix_display_qr_code.data;
    }

    return res.status(200).json({
      client_secret: paymentIntent.client_secret,
      pix_copia_e_cola: pixCopiaECola
    });

  } catch (error) {
    console.error('Erro no Stripe:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
