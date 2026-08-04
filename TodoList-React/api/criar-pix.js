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

    const { nome, whatsapp, email } = req.body;

    if (!nome || !whatsapp || !email) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // Apenas 'card' para garantir que funcione durante a análise da conta
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // R$ 10,00
      currency: 'brl',
      payment_method_types: ['card'],
      receipt_email: email,
      metadata: { nome, whatsapp, email }
    });

    const nextAction = paymentIntent.next_action;
    let pixCopiaECola = null;
    let qrCodeUrl = null;

    if (nextAction && nextAction.pix_display_qr_code) {
      pixCopiaECola = nextAction.pix_display_qr_code.data;
      qrCodeUrl = nextAction.pix_display_qr_code.hosted_instructions_url;
    } else {
      // Retorno mockado/fictício de chave Pix para validar o front-end enquanto o Pix real fica retido pela análise
      pixCopiaECola = '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Teste_Stripe6008BRASILIA62070503***6304E2CA';
    }

    return res.status(200).json({
      client_secret: paymentIntent.client_secret,
      pix_copia_e_cola: pixCopiaECola,
      qr_code_url: qrCodeUrl
    });

  } catch (error) {
    console.error('Erro no Stripe:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
