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

    // Criação do PaymentIntent configurado para Pix
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // Exemplo: R$ 10,00 (ajuste o valor em centavos conforme necessário)
      currency: 'brl',
      payment_method_types: ['pix'],
      receipt_email: email,
      metadata: {
        nome,
        whatsapp,
        email
      }
    });

    // Extração dos dados do Pix gerados pelo Stripe
    const nextAction = paymentIntent.next_action;
    let pixCopiaECola = null;
    let qrCodeUrl = null;

    if (nextAction && nextAction.pix_display_qr_code) {
      pixCopiaECola = nextAction.pix_display_qr_code.data;
      qrCodeUrl = nextAction.pix_display_qr_code.hosted_instructions_url; 
      // Nota: O Stripe também fornece o SVG do QR code se preferir renderizar direto
    }

    return res.status(200).json({
      client_secret: paymentIntent.client_secret,
      pix_copia_e_cola: pixCopiaECola,
      qr_code_url: qrCodeUrl
    });

  } catch (error) {
    console.error('Erro ao gerar Pix no Stripe:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
