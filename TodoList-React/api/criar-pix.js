import Stripe from 'stripe';

// Inicializa o Stripe com a chave secreta que estará configurada nas variáveis de ambiente da Vercel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Garante que a requisição é do tipo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }

  try {
    const { nome, whatsapp, email } = req.body;

    // Validação básica dos campos
    if (!nome || !whatsapp || !email) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // Cria a intenção de pagamento no Stripe configurada especificamente para PIX
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // Valor em centavos (Ex: R$ 50,00 = 5000)
      currency: 'brl',
      payment_method_types: ['pix'],
      receipt_email: email,
      // Metadata crucial: guarda os dados do usuário para o webhook recuperar depois que o dinheiro cair
      metadata: {
        nome: nome,
        whatsapp: whatsapp,
        email: email
      },
    });

    // Como o Pix no PaymentIntents precisa gerar a source/next_action, 
    // buscamos o client_secret ou os detalhes do Pix gerados pelo Stripe.
    // Vamos confirmar se o payment_intent gerou os dados do Pix:
    
    // Nota: Para obter o qrcode e o copia-e-cola diretamente na criação do payment_intent com Pix:
    const paymentMethod = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method_data: {
        type: 'pix',
      },
      return_url: 'https://seu-site.vercel.app/pagamentos', // Ajuste para a URL de retorno se necessário
    });

    const pixDetails = paymentMethod.next_action?.pix_display_qr_code;

    if (!pixDetails) {
      return res.status(400).json({ error: 'Não foi possível gerar os detalhes do Pix.' });
    }

    // Retorna os dados do Pix para o frontend em React exibir ao usuário
    return res.status(200).json({
      success: true,
      client_secret: paymentIntent.client_secret,
      pix_copia_e_cola: pixDetails.data,
      qr_code_url: pixDetails.image_url_svg // ou image_url_png dependendo do formato desejado
    });

  } catch (error) {
    console.error('Erro ao criar Pix no Stripe:', error);
    return res.status(500).json({ error: error.message });
  }
}
