import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

    const { matricula, nome, whatsapp, email, cupom, device_id } = req.body || {};

    if (!matricula || !nome || !whatsapp || !email) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // 🖥️ LOG NA VERCEL: Exibe o Device ID recebido da requisição
    console.log(`📱 [CHECKOUT] Requisição recebida para Matrícula: ${matricula} | Device ID: ${device_id || 'NÃO INFORMADO'}`);

    // 🛑 1. VALIDAÇÃO INTELIGENTE DE DEVICE_ID NO SUPABASE
    let permitirCupom = true; // Por padrão, novos aparelhos podem usar cupons

    if (device_id) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verifica se já existe qualquer licença vinculada a este device_id
        const { data: historicoAparelho, error: supabaseError } = await supabase
          .from('licencas')
          .select('id, tipo, chave')
          .eq('device_id', device_id.trim())
          .maybeSingle();

        if (supabaseError) {
          console.error('❌ Erro ao consultar Supabase para anti-abuso:', supabaseError);
        }

        // Se encontrou qualquer registro, o aparelho NÃO é mais novo
        if (historicoAparelho) {
          permitirCupom = false;
          console.log(`🔒 [ANTI-ABUSO VERCEL] Histórico encontrado para o Device ID: ${device_id.trim()} (Licença tipo: ${historicoAparelho.tipo}). Campo de cupom desativado.`);
        } else {
          console.log(`✅ [ANTI-ABUSO VERCEL] Nenhum histórico prévio para o Device ID: ${device_id.trim()}. Cupom liberado.`);
        }
      }
    } else {
      console.warn(`⚠️ [ALERTA VERCEL] A requisição chegou sem nenhum 'device_id'.`);
    }

    // 🔍 2. Buscar se já existe um cliente cadastrado no Stripe com este e-mail
    const existingCustomers = await stripe.customers.list({
      email: email.trim(),
      limit: 1,
    });

    let customerId;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
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

    // 🎟️ 3. Criação da Checkout Session com controle dinâmico de cupons
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      customer: customerId,
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

      // CONTROLE DINÂMICO NO STRIPE
      allow_promotion_codes: permitirCupom,

      success_url: `https://wa.me/5521969254192?text=Pagamento%20realizado%20com%20sucesso!%20Matricula:%20${encodeURIComponent(matricula)}`,
      cancel_url: `https://wa.me/5521969254192?text=O%20pagamento%20da%20licenca%20foi%20cancelado.`,
      metadata: {
        matricula,
        nome,
        whatsapp,
        email,
        device_id: device_id || '',
        cupom: permitirCupom ? (cupom || 'nenhum') : 'bloqueado_reuso',
      },
    });

    console.log(`🚀 [CHECKOUT CRIADO] Sessão do Stripe gerada com sucesso. URL: ${session.url} | Cupom permitido: ${permitirCupom}`);

    return res.status(200).json({
      checkout_url: session.url
    });

  } catch (error) {
    console.error('❌ Erro crítico no Stripe Checkout:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor ao criar o Checkout.' });
  }
}
