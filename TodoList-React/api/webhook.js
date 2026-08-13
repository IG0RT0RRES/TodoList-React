import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

function gerarChave() {
  const letras = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  const numeros = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');
  return `${letras}${numeros}`;
}

async function enviarWhatsapp(whatsapp, nome, licenseKey, dataValidadeFormatada, isRenovacao) {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!whatsapp) return;
  if (!token || !phoneNumberId) return;

  const whatsappApiUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
  const numeroFormatado = whatsapp.replace(/\D/g, '');

  const payloadMeta = {
    messaging_product: 'whatsapp',
    to: numeroFormatado,
    type: 'template',
    template: {
      name: 'envio_licenca',
      language: { code: 'pt_BR' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: nome },
            { type: 'text', text: licenseKey },
            { type: 'text', text: dataValidadeFormatada }
          ]
        }
      ]
    }
  };

  try {
    await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadMeta),
    });
  } catch (error) {
    console.error('❌ Erro na requisição para Meta WhatsApp API:', error);
  }
}

async function enviarWebhookDiscord(licenseKey, customerEmail, nome, matriculaFormatada, whatsapp, dataAquisicao, dataValidade, isRenovacao) {
  const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const titulo = isRenovacao ? 'Licença Renovada (+30 Dias)' : 'Nova Licença Gerada (30 Dias)';
  const descricao = isRenovacao
    ? 'Um pagamento de renovação foi processado e a validade da chave existente foi estendida.'
    : 'Um novo colaborador foi cadastrado e salvo no Supabase.';

  const payload = {
    username: 'Stripe Pix Bot',
    content: isRenovacao ? 'Renovação de licença concluída!' : 'Novo pagamento e acesso liberado!',
    embeds: [
      {
        title: titulo,
        description: descricao,
        color: isRenovacao ? 3066993 : 16711680,
        fields: [
          { name: 'Código de Acesso', value: licenseKey, inline: true },
          { name: 'Tipo', value: isRenovacao ? 'Renovação' : 'Novo Colaborador', inline: true },
          { name: 'Colaborador', value: matriculaFormatada || nome, inline: false },
          { name: 'WhatsApp', value: whatsapp || 'Não informado', inline: true },
          { name: 'E-mail', value: customerEmail, inline: true },
          { name: 'Data da Operação', value: dataAquisicao, inline: true },
          { name: 'Válido até', value: dataValidade, inline: true },
        ],
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Erro ao enviar Webhook Discord:', error);
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', message: 'Webhook Supabase endpoint running' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  let event;

  try {
    const buf = await getRawBody(req);
    const sig = req.headers['stripe-signature'];

    if (endpointSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
      } catch (err) {
        event = JSON.parse(buf.toString('utf8'));
      }
    } else {
      event = JSON.parse(buf.toString('utf8'));
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventType = event.type;

  if (eventType === 'checkout.session.completed' || eventType === 'payment_intent.succeeded') {
    const objectData = event.data.object;
    const metadata = objectData.metadata || {};

    const nome = metadata.nome || metadata.matricula_nome || objectData.customer_details?.name || '';
    const matricula = metadata.matricula || '';
    
    let customerEmail = '';
    if (objectData.customer_details?.email) {
      customerEmail = objectData.customer_details.email;
    } else if (objectData.receipt_email) {
      customerEmail = objectData.receipt_email;
    } else if (metadata.email) {
      customerEmail = metadata.email;
    }

    const isDadosInvalidos = (!customerEmail || customerEmail === 'Cliente desconhecido') && !nome && !matricula;
    if (isDadosInvalidos) {
      console.warn('⚠️ Webhook ignorado: Evento do Stripe sem dados identificáveis do cliente.');
      return res.status(200).json({ status: 'ignored', reason: 'Missing customer identification metadata' });
    }

    try {
      const whatsapp = 
        metadata.whatsapp || 
        objectData.customer_details?.phone || 
        objectData.shipping?.phone || 
        '';

      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Credenciais do Supabase ausentes no servidor.');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Garantir ou inserir o colaborador na tabela "colaboradores" com upsert seguro
      let colaboradorId = null;

      if (matricula) {
        const { data: colabData, error: colabError } = await supabase
          .from('colaboradores')
          .upsert({
            matricula: matricula.trim(),
            nome: (nome || 'Cliente').toUpperCase(),
            email: customerEmail || metadata.email || null,
            equipe: metadata.equipe || null,
            projeto: metadata.projeto || null,
            supervisor: metadata.supervisor || null
          }, { onConflict: 'matricula' })
          .select('id')
          .single();

        if (colabError) {
          console.error("Erro ao salvar colaborador no Supabase:", colabError);
          throw new Error("Erro ao salvar colaborador: " + colabError.message);
        }

        if (colabData) {
          colaboradorId = colabData.id;
        }
      }

      // 2. Verificar se já existe uma licença ativa para este cliente
      let queryLicenca = supabase.from('licencas').select('*, colaboradores(matricula, nome)');
      
      if (colaboradorId) {
        queryLicenca = queryLicenca.eq('colaborador_id', colaboradorId);
      } else if (whatsapp) {
        queryLicenca = queryLicenca.eq('whatsapp', whatsapp);
      }

      const { data: licencasEncontradas } = await queryLicenca;
      const licencaExistente = licencasEncontradas && licencasEncontradas.length > 0 ? licencasEncontradas[0] : null;

      let chaveUso = '';
      let isRenovacao = false;
      const agora = new Date();
      let novaDataValidade = new Date();

      if (licencaExistente) {
        isRenovacao = true;
        chaveUso = licencaExistente.chave;
        const dataValidadeAtual = new Date(licencaExistente.data_validade);

        if (dataValidadeAtual.getFullYear() >= 2099) {
          novaDataValidade = dataValidadeAtual;
        } else {
          const dataBase = dataValidadeAtual > agora ? dataValidadeAtual : agora;
          novaDataValidade = new Date(dataBase);
          novaDataValidade.setDate(novaDataValidade.getDate() + 30);
        }

        // Atualiza a validade e status no Supabase
        const { error: updateError } = await supabase
          .from('licencas')
          .update({
            data_validade: novaDataValidade.toISOString(),
            status: 'ativa'
          })
          .eq('chave', chaveUso);

        if (updateError) {
          console.error("Erro ao atualizar licença existente:", updateError);
          throw new Error("Erro ao atualizar licença: " + updateError.message);
        }

      } else {
        // Nova licença gerada corretamente vinculada ao colaborador
        chaveUso = gerarChave();
        novaDataValidade.setDate(agora.getDate() + 30);

        const { error: insertLicencaError } = await supabase.from('licencas').insert([{
          colaborador_id: colaboradorId,
          chave: chaveUso,
          data_aquisicao: agora.toISOString(),
          data_validade: novaDataValidade.toISOString(),
          status: 'ativa',
          whatsapp: whatsapp || null,
          admin: false
        }]);

        if (insertLicencaError) {
          console.error("Erro ao inserir nova licença:", insertLicencaError);
          throw new Error("Erro ao criar licença: " + insertLicencaError.message);
        }
      }

      const dataAquisicaoFormatada = agora.toLocaleDateString('pt-BR');
      const dataValidadeFormatada = novaDataValidade.toLocaleDateString('pt-BR');
      const colaboradorFormatado = matricula ? `${matricula} - ${(nome || '').toUpperCase()}` : (nome ? nome.toUpperCase() : 'CLIENTE');

      // 3. Disparar notificações em segundo plano (WhatsApp e Discord)
      await Promise.all([
        enviarWhatsapp(whatsapp, nome || 'Cliente', chaveUso, dataValidadeFormatada, isRenovacao).catch(() => {}),
        enviarWebhookDiscord(
          chaveUso,
          customerEmail || 'Não informado',
          nome || 'Cliente',
          colaboradorFormatado,
          whatsapp,
          dataAquisicaoFormatada,
          dataValidadeFormatada,
          isRenovacao
        ).catch(() => {}),
      ]);

      return res.status(200).json({
        status: 'success',
        tipo: isRenovacao ? 'renovacao' : 'novo_colaborador',
        license: chaveUso,
        valid_until: dataValidadeFormatada,
      });

    } catch (ex) {
      console.error('Erro no processamento do webhook com Supabase:', ex);
      return res.status(500).json({ status: 'error', detalhe: ex.message });
    }
  }

  return res.status(200).json({ status: 'ignored', event: eventType });
}
