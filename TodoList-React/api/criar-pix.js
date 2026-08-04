const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nome, whatsapp, email } = req.body;

    if (!nome || !whatsapp || !email) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // Permitindo 'card' e 'pix' para permitir testes imediatos
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // R$ 10,00 em centavos
      currency: 'brl',
      payment_method_types: ['card', 'pix'],
      receipt_email: email,
      metadata: {
        nome,
        whatsapp,
        email
      }
    });

    const nextAction = paymentIntent.next_action;
    let pixCopiaECola = null;
    let qrCodeUrl = null;

    if (nextAction && nextAction.pix_display_qr_code) {
      pixCopiaECola = nextAction.pix_display_qr_code.data;
      qrCodeUrl = nextAction.pix_display_qr_code.hosted_instructions_url; 
    }

    return res.status(200).json({
      client_secret: paymentIntent.client_secret,
      pix_copia_e_cola: pixCopiaECola,
      qr_code_url: qrCodeUrl
    });

  } catch (error) {
    console.error('Erro no Stripe:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
