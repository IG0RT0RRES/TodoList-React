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

// 📧 FUNÇÃO DE ENVIO DO EMAILJS COM TEMPLATE DINÂMICO UNIFICADO (COM SUPORTE A FALHA)
async function enviarEmailJS(customerEmail, nome, licenseKey, dataValidadeFormatada, tipoStatus) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !customerEmail) return;

  const emailJsUrl = 'https://api.emailjs.com/api/v1.0/email/send';

  let configuracao = {
    cor_fundo: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    cor_borda: '#3b82f6',
    cor_texto: '#60a5fa',
    titulo_email: 'Acesso Liberado! 🚀',
    mensagem_corpo: 'Sua nova licença foi gerada com sucesso e já está pronta para uso no aplicativo.',
    conteudo_destaque: licenseKey,
    detalhe_rodape: `📅 Validade do Acesso: ${dataValidadeFormatada}`
  };

  if (tipoStatus === 'renovacao') {
    configuracao = {
      cor_fundo: 'linear-gradient(135deg, #059669, #047857)',
      cor_borda: '#10b981',
      cor_texto: '#34d399',
      titulo_email: 'Licença Renovada! 🔄',
      mensagem_corpo: 'O seu pagamento recorrente foi confirmado e a validade da sua licença foi estendida com sucesso.',
      conteudo_destaque: licenseKey,
      detalhe_rodape: `🗓️ Nova Validade: ${dataValidadeFormatada}`
    };
  } else if (tipoStatus === 'degustacao') {
    configuracao = {
      cor_fundo: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      cor_borda: '#8b5cf6',
      cor_texto: '#a78bfa',
      titulo_email: 'Bem-vindo ao Teste Grátis! 🎁',
      mensagem_corpo: 'Seu cupom de degustação foi ativado com sucesso. Aproveite seus 3 dias de acesso total!',
      conteudo_destaque: licenseKey,
      detalhe_rodape: `⏱️ Válido até: ${dataValidadeFormatada}`
    };
  } else if (tipoStatus === 'falha_pagamento') {
    configuracao = {
      cor_fundo: 'linear-gradient(135deg, #dc2626, #b91c1c)', // Vermelho Alerta
      cor_borda: '#ef4444',
      cor_texto: '#f87171',
      titulo_email: 'Falha na Renovação da Assinatura ⚠️',
      mensagem_corpo: 'Não foi possível processar o pagamento da sua mensalidade. Verifique os dados do seu cartão para evitar a suspensão do acesso.',
      conteudo_destaque: 'AÇÃO NECESSÁRIA',
      detalhe_rodape: `❌ O acesso poderá expirar caso o pagamento não seja regularizado.`
    };
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: customerEmail,
      to_name: nome,
      ...configuracao
    }
  };

  try {
    const response = await fetch(emailJsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta do EmailJS:', response.status, errorText);
    } else {
      console.log(`✅ E-mail (${tipoStatus}) enviado com sucesso para ${customerEmail}`);
    }
  } catch (error) {
    console.error('❌ Erro na requisição para EmailJS:', error);
  }
}

async function enviarWebhookDiscord(licenseKey, customerEmail, nome, matriculaFormatada, whatsapp, dataAquisicao, dataValidade, statusOperacao) {
  const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  let titulo = 'Nova Licença Gerada (30 Dias)';
  let descricao = 'Um novo colaborador realizou uma assinatura.';
  let cor = 16711680;
  let conteudoBot = 'Novo pagamento e acesso liberado!';

  if (statusOperacao === 'degustacao') {
    titulo = '🎁 Licença de Degustação Gerada (3 Dias)';
    descricao = 'Cupom CAD2026 aplicado!';
    cor = 3447003;
    conteudoBot = '🎁 Novo teste grátis ativado!';
  } else if (statusOperacao === 'renovacao') {
    titulo = 'Assinatura Renovada (+30 Dias)';
    descricao = 'Um pagamento recorrente foi processado e a licença foi estendida.';
    cor = 3066993;
    conteudoBot = 'Renovação de assinatura concluída!';
  } else if (statusOperacao === 'falha_pagamento') {
    titulo = '⚠️ Falha no Pagamento da Assinatura';
    descricao = 'Uma tentativa de cobrança recorrente falhou no Stripe.';
    cor = 15158332; // Vermelho Alerta
    conteudoBot = '⚠️ Atenção: Falha de pagamento!';
  }

  const fields = [
    { name: 'Tipo', value: statusOperacao.toUpperCase(), inline: true },
    { name: 'Colaborador', value: matriculaFormatada || nome, inline: false },
    { name: 'WhatsApp', value: whatsapp || 'Não informado', inline: true },
    { name: 'E-mail', value: customerEmail, inline: true },
    { name: 'Data', value: dataAquisicao, inline: true },
    { name: 'Código / Status', value: licenseKey, inline: true },
    { name: 'Válido até', value: dataValidade, inline: true },
  ];

  const payload = {
    username: 'Stripe Bot',
    content: conteudoBot,
    embeds: [{ title: titulo, description: descricao, color: cor, fields: fields }],
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

    if (endpointSecret) {
      if (!sig) {
        return res.status(400).send('Webhook Error: Stripe signature missing');
      }
      try {
        event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      event = JSON.parse(buf.toString('utf8'));
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventType = event.type;

  // 🎯 Adicionado 'invoice.payment_failed' para capturar falhas de cobrança recorrente
  if (
    eventType === 'checkout.session.completed' || 
    eventType === 'payment_intent.succeeded' || 
    eventType === 'invoice.payment_succeeded' ||
    eventType === 'invoice.payment_failed'
  ) {
    const objectData = event.data.object;
    
    let metadata = objectData.metadata || {};
    
    if ((eventType === 'invoice.payment_succeeded' || eventType === 'invoice.payment_failed') && objectData.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(objectData.subscription);
        metadata = subscription.metadata || metadata;
      } catch (e) {
        console.error('⚠️ Não foi possível buscar metadados da assinatura:', e.message);
      }
    }

    const nome = metadata.nome || objectData.customer_name || objectData.customer_details?.name || '';
    const matricula = metadata.matricula || '';

    let customerEmail = '';
    if (objectData.customer_email) {
      customerEmail = objectData.customer_email;
    } else if (objectData.customer_details?.email) {
      customerEmail = objectData.customer_details.email;
    } else if (objectData.receipt_email) {
      customerEmail = objectData.receipt_email;
    } else if (metadata.email) {
      customerEmail = metadata.email;
    }

    customerEmail = customerEmail ? customerEmail.trim().toLowerCase() : '';

    const whatsapp = (
      metadata.whatsapp || 
      objectData.customer_details?.phone || 
      objectData.shipping?.phone || 
      ''
    ).trim();

    // 🛑 TRATAMENTO ESPECÍFICO PARA FALHA DE PAGAMENTO
    if (eventType === 'invoice.payment_failed') {
      console.warn(`⚠️ [PAGAMENTO FALHOU] Assinatura/Fatura falhou para: ${customerEmail} (Matrícula: ${matricula})`);
      
      const dataAtualStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      // Opcional: Atualizar status da licença no Supabase para 'inadimplente' ou 'atrasada' se desejar bloquear
      try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseKey && matricula) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          // Opcional: Você pode alterar o status na tabela licencas para 'pendente' ou 'atrasado'
          await supabase.from('licencas').update({ status: 'pendente' }).eq('whatsapp', whatsapp);
        }
      } catch (dbErr) {
        console.error('Erro ao atualizar status de inadimplência no Supabase:', dbErr);
      }

      // Dispara os alertas de falha (EmailJS + Discord)
      await Promise.allSettled([
        enviarEmailJS(customerEmail, nome || 'Cliente', 'FALHA DE PAGAMENTO', dataAtualStr, 'falha_pagamento'),
        enviarWebhookDiscord(
          'FALHA_PAGAMENTO',
          customerEmail || 'Não informado',
          nome || 'Cliente',
          matricula ? `${matricula} - ${nome}` : nome,
          whatsapp,
          dataAtualStr,
          'Expirando em breve',
          'falha_pagamento'
        )
      ]);

      return res.status(200).json({ status: 'handled_failure', email: customerEmail });
    }

    // Fluxo normal para pagamentos bem-sucedidos (Checkout, Primeiro Pagamento ou Renovação)
    const houveDesconto = objectData.total_details?.amount_discount > 0 || objectData.discount;
    const cupomMetadados = metadata.cupom === 'CAD2026';
    let isDegustacao = houveDesconto || cupomMetadados;

    const isDadosInvalidos = !customerEmail && !nome && !matricula;
    if (isDadosInvalidos) {
      return res.status(200).json({ status: 'ignored', reason: 'Missing customer identification metadata' });
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Credenciais do Supabase ausentes no servidor.');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      let diasValidade = isDegustacao ? 3 : 30;
      const tipoLicenca = isDegustacao ? 'degustacao' : 'mensal';

      let colaboradorId = null;

      if (matricula || customerEmail) {
        const filtros = [];
        if (matricula) filtros.push(`matricula.eq.${matricula.trim()}`);
        if (customerEmail) filtros.push(`email.eq.${customerEmail}`);

        const { data: colabsEncontrados } = await supabase
          .from('colaboradores')
          .select('id, matricula, email')
          .or(filtros.join(','));

        const colabExistente = colabsEncontrados && colabsEncontrados.length > 0 ? colabsEncontrados[0] : null;

        if (colabExistente) {
          colaboradorId = colabExistente.id;
          await supabase.from('colaboradores').update({
            nome: (nome || 'Cliente').toUpperCase(),
            email: customerEmail || colabExistente.email,
          }).eq('id', colaboradorId);
        } else if (matricula || customerEmail) {
          const { data: novoColab } = await supabase
            .from('colaboradores')
            .insert([{
              matricula: matricula ? matricula.trim() : `TEMP_${Date.now()}`,
              nome: (nome || 'Cliente').toUpperCase(),
              email: customerEmail || null,
            }])
            .select('id')
            .single();

          if (novoColab) colaboradorId = novoColab.id;
        }
      }

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

      const agoraStr = new Date();
      agoraStr.setHours(agoraStr.getHours() - 3);      
      const agora = new Date(agoraStr);
      let novaDataValidade = new Date(agora);

      if (licencaExistente) {
        isRenovacao = true;
        chaveUso = licencaExistente.chave;
        const dataValidadeAtual = new Date(licencaExistente.data_validade);

        if (dataValidadeAtual.getFullYear() >= 2099) {
          novaDataValidade = dataValidadeAtual;
        } else {
          const dataBase = dataValidadeAtual > agora ? dataValidadeAtual : agora;
          novaDataValidade = new Date(dataBase);
          novaDataValidade.setDate(novaDataValidade.getDate() + diasValidade);
        }

        await supabase
          .from('licencas')
          .update({
            data_validade: novaDataValidade.toISOString(),
            status: 'ativa',
            tipo: tipoLicenca,
          })
          .eq('chave', chaveUso);

      } else {
        chaveUso = gerarChave();
        novaDataValidade.setDate(agora.getDate() + diasValidade);

        await supabase.from('licencas').insert([{
          colaborador_id: colaboradorId,
          chave: chaveUso,
          data_aquisicao: agora.toISOString(),
          data_validade: novaDataValidade.toISOString(),
          status: 'ativa',
          tipo: tipoLicenca,
          whatsapp: whatsapp || null,
          admin: false
        }]);
      }

      const dataAquisicaoFormatada = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const dataValidadeFormatada = novaDataValidade.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const colaboradorFormatado = matricula ? `${matricula} - ${(nome || '').toUpperCase()}` : (nome ? nome.toUpperCase() : 'CLIENTE');

      const statusEmail = isDegustacao ? 'degustacao' : (isRenovacao ? 'renovacao' : 'novo');

      await Promise.allSettled([
        enviarEmailJS(customerEmail, nome || 'Cliente', chaveUso, dataValidadeFormatada, statusEmail),
        enviarWebhookDiscord(
          chaveUso,
          customerEmail || 'Não informado',
          nome || 'Cliente',
          colaboradorFormatado,
          whatsapp,
          dataAquisicaoFormatada,
          dataValidadeFormatada,
          statusEmail
        )
      ]);

      return res.status(200).json({
        status: 'success',
        tipo: statusEmail,
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
