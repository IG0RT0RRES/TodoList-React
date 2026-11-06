import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION;

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

// 📧 FUNÇÃO DE ENVIO DO EMAILJS COM TEMPLATE DINÂMICO UNIFICADO
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
      mensagem_corpo: 'O seu pagamento foi confirmado e a validade da sua licença foi estendida com sucesso.',
      conteudo_destaque: licenseKey,
      detalhe_rodape: `🗓️ Nova Validade: ${dataValidadeFormatada}`
    };
  } else if (tipoStatus === 'degustacao') {
    configuracao = {
      cor_fundo: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      cor_borda: '#8b5cf6',
      cor_texto: '#a78bfa',
      titulo_email: 'Bem-vindo ao Teste Grátis! 🎁',
      mensagem_corpo: 'Seu período de degustação foi ativado com sucesso. Aproveite seus 3 dias de acesso total ao aplicativo!',
      conteudo_destaque: licenseKey,
      detalhe_rodape: `⏱️ Válido até: ${dataValidadeFormatada}`
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

async function enviarWebhookDiscord(licenseKey, customerEmail, nome, matriculaFormatada, whatsapp, dataAquisicao, dataValidade, isRenovacao, isDegustacao, metodoPagamento = 'Cartão/Assinatura') {
  const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  let titulo = `Nova Licença Gerada (${metodoPagamento})`;
  let descricao = 'Um novo pagamento foi aprovado e salvo no Supabase.';
  let cor = 16711680; 
  let conteudoBot = 'Novo pagamento e acesso liberado!';

  if (isDegustacao) {
    titulo = '🎁 Licença de Degustação Gerada (3 Dias)';
    descricao = 'Período de teste grátis (trial) ativado para o colaborador.';
    cor = 3447003; 
    conteudoBot = '🎁 Novo teste grátis ativado!';
  } else if (isRenovacao) {
    titulo = `Licença Renovada / Estendida (${metodoPagamento})`;
    descricao = 'Um pagamento foi processado e a validade da chave foi estendida.';
    cor = 3066993; 
    conteudoBot = 'Renovação de licença concluída!';
  }

  const tipoTexto = isDegustacao ? 'Degustação (3 Dias)' : (isRenovacao ? `Renovação (${metodoPagamento})` : `Novo Pagamento (${metodoPagamento})`);

  const fields = [
    { name: 'Tipo', value: tipoTexto, inline: true },
    { name: 'Colaborador', value: matriculaFormatada || nome, inline: false },
    { name: 'WhatsApp', value: whatsapp || 'Não informado', inline: true },
    { name: 'E-mail', value: customerEmail, inline: true },
    { name: 'Data da Operação', value: dataAquisicao, inline: true },
    { name: 'Código de Acesso', value: licenseKey, inline: true },
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

// ⚙️ FUNÇÃO CENTRALIZADA DE PROCESSAMENTO DE LIBERAÇÃO DE LICENÇA (USADA POR CARTÃO E PIX)
async function processarLiberacaoLicenca(supabase, dadosCliente) {
  const { matricula, nome, customerEmail, whatsapp, diasValidade, isDegustacao } = dadosCliente;
  
  let tipoLicenca = isDegustacao ? 'degustacao' : 'mensal';
  let colaboradorId = null;

  // 🔍 BUSCA POR MATRÍCULA OU E-MAIL
  if (matricula) {
    const { data: colabPorMatricula } = await supabase
      .from('colaboradores')
      .select('id, email')
      .eq('matricula', matricula)
      .maybeSingle();

    if (colabPorMatricula) {
      colaboradorId = colabPorMatricula.id;

      if (customerEmail && colabPorMatricula.email !== customerEmail) {
        console.log(`🔄 Atualizando e-mail do colaborador ${matricula} de "${colabPorMatricula.email}" para "${customerEmail}"`);
        await supabase
          .from('colaboradores')
          .update({ email: customerEmail })
          .eq('id', colaboradorId);
      }
    }
  }

  if (!colaboradorId && customerEmail) {
    const { data: colabPorEmail } = await supabase
      .from('colaboradores')
      .select('id, matricula')
      .eq('email', customerEmail)
      .maybeSingle();

    if (colabPorEmail) {
      colaboradorId = colabPorEmail.id;
    }
  }

  if (!colaboradorId) {
    const { data: novoColab, error: colabError } = await supabase
      .from('colaboradores')
      .insert([{
        matricula: matricula ? matricula : `TEMP_${Date.now()}`,
        nome: (nome || 'Cliente').toUpperCase(),
        email: customerEmail || null,
      }]).select('id').single();

    if (colabError) {
      console.error("Erro ao salvar colaborador no Supabase:", colabError);
      throw new Error("Erro ao salvar colaborador: " + colabError.message);
    }

    colaboradorId = novoColab.id;
  }

  const { data: licencasEncontradas } = await supabase
    .from('licencas')
    .select('*, colaboradores(matricula, nome)')
    .eq('colaborador_id', colaboradorId);

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
      const eraDegustacao = licencaExistente.tipo === 'degustacao';
      const dataBase = (dataValidadeAtual > agora && !eraDegustacao) ? dataValidadeAtual : agora;

      novaDataValidade = new Date(dataBase);
      novaDataValidade.setDate(novaDataValidade.getDate() + diasValidade);
    }

    const { error: updateError } = await supabase
      .from('licencas')
      .update({
        data_validade: novaDataValidade.toISOString(),
        status: 'ativa',
        tipo: tipoLicenca, 
      })
      .eq('chave', chaveUso);

    if (updateError) throw updateError;
  } else {
    // 🛡️ GARANTIA DE CHAVE ÚNICA NO BANCO
    let chaveUnica = false;
    let tentativas = 0;

    while (!chaveUnica && tentativas < 5) {
      tentativas++;
      chaveUso = gerarChave();

      const { data: chaveExistente } = await supabase
        .from('licencas')
        .select('chave')
        .eq('chave', chaveUso)
        .maybeSingle();

      if (!chaveExistente) {
        chaveUnica = true;
      }
    }

    if (!chaveUnica) {
      throw new Error('Não foi possível gerar uma chave de licença única após várias tentativas.');
    }

    novaDataValidade.setDate(agora.getDate() + diasValidade);

    const { error: insertLicencaError } = await supabase.from('licencas').insert([{
      colaborador_id: colaboradorId,
      chave: chaveUso,
      data_aquisicao: agora.toISOString(),
      data_validade: novaDataValidade.toISOString(),
      status: 'ativa',
      tipo: tipoLicenca,
      whatsapp: whatsapp || null,
      admin: false
    }]);

    if (insertLicencaError) {
      console.error("Erro ao inserir nova licença:", insertLicencaError);
      throw new Error("Erro ao criar licença: " + insertLicencaError.message);
    }
  }

  const dataAquisicaoFormatada = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const dataValidadeFormatada = novaDataValidade.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const colaboradorFormatado = matricula ? `${matricula} - ${(nome || '').toUpperCase()}` : (nome ? nome.toUpperCase() : 'CLIENTE');

  const statusEmail = isDegustacao ? 'degustacao' : (isRenovacao ? 'renovacao' : 'novo');

  return {
    customerEmail,
    nome: nome || 'Cliente',
    chaveUso,
    dataValidadeFormatada,
    statusEmail,
    colaboradorFormatado,
    whatsapp,
    dataAquisicaoFormatada,
    isRenovacao,
    isDegustacao
  };
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
        console.error('❌ Assinatura stripe-signature ausente no cabeçalho.');
        return res.status(400).send('Webhook Error: Stripe signature missing');
      }
      try {
        event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
      } catch (err) {
        console.error(`❌ Falha ao validar evento do Stripe: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      event = JSON.parse(buf.toString('utf8'));
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventType = event.type;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Credenciais do Supabase ausentes no servidor.');
    return res.status(500).json({ status: 'error', detalhe: 'Credenciais do Supabase ausentes' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 🎯 1. TRATAMENTO PARA ASSINATURA EXPIRADA (Cartão)
  if (eventType === 'customer.subscription.deleted' || eventType === 'customer.subscription.paused') {
    const subscription = event.data.object;
    const metadata = subscription.metadata || {};
    const matricula = metadata.matricula || '';

    console.log(`❌ [ASSINATURA EXPIRADA] Matrícula: ${matricula}`);

    try {
      if (matricula) {
        const { data: colab } = await supabase
          .from('colaboradores')
          .select('id')
          .eq('matricula', matricula.trim())
          .single();

        if (colab) {
          await supabase
            .from('licencas')
            .update({ status: 'expirada' })
            .eq('colaborador_id', colab.id);
        }
      }

      return res.status(200).json({ status: 'success', action: 'subscription_expired_processed' });
    } catch (err) {
      console.error('❌ Erro ao atualizar status para expirada:', err);
      return res.status(500).json({ status: 'error', detalhe: err.message });
    }
  }

  // 🎯 2. TRATAMENTO PARA FALHAS DE PAGAMENTO (Faturas)
  if (eventType === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const metadata = invoice.metadata || invoice.lines?.data?.[0]?.metadata || {};
    const matricula = metadata.matricula || '';

    if (invoice.attempt_count >= 3 || invoice.status === 'uncollectible') {
      try {
        if (matricula) {
          const { data: colab } = await supabase
            .from('colaboradores')
            .select('id')
            .eq('matricula', matricula.trim())
            .single();

          if (colab) {
            await supabase
              .from('licencas')
              .update({ status: 'expirada' })
              .eq('colaborador_id', colab.id);
          }
        }
      } catch (err) {
        console.error('❌ Erro ao expirar licença por falha de pagamento:', err);
      }
    }

    return res.status(200).json({ status: 'received', action: 'payment_failed_logged' });
  }

  // 🎯 3. PAGAMENTO DE PIX / SESSÃO CONCLUÍDA COM SUCESSO (checkout.session.completed)
  if (eventType === 'checkout.session.completed') {
    const session = event.data.object;

    // Processamos apenas se o pagamento foi concluído (especialmente útil para PIX mode 'payment')
    if (session.payment_status === 'paid') {
      const metadata = session.metadata || {};
      const matricula = (metadata.matricula || '').trim();
      const nome = metadata.nome || session.customer_details?.name || '';
      let customerEmail = (session.customer_details?.email || metadata.email || '').trim().toLowerCase();
      const whatsapp = (metadata.whatsapp || session.customer_details?.phone || '').trim();

      console.log('📦 [PIX/CHECKOUT SUCESSO] Dados recebidos:', { matricula, nome, customerEmail, total: session.amount_total });

      if (!matricula && !customerEmail) {
        console.warn('⚠️ Webhook Checkout ignorado: Sem dados identificáveis.');
        return res.status(200).json({ status: 'ignored', reason: 'Missing identification metadata' });
      }

      try {
        // Pix dá 30 dias de acesso
        const dadosProcessados = await processarLiberacaoLicenca(supabase, {
          matricula,
          nome,
          customerEmail,
          whatsapp,
          diasValidade: 30,
          isDegustacao: false
        });

        await Promise.allSettled([
          enviarEmailJS(dadosProcessados.customerEmail, dadosProcessados.nome, dadosProcessados.chaveUso, dadosProcessados.dataValidadeFormatada, dadosProcessados.statusEmail),
          enviarWebhookDiscord(
            dadosProcessados.chaveUso,
            dadosProcessados.customerEmail || 'Não informado',
            dadosProcessados.nome,
            dadosProcessados.colaboradorFormatado,
            dadosProcessados.whatsapp,
            dadosProcessados.dataAquisicaoFormatada,
            dadosProcessados.dataValidadeFormatada,
            dadosProcessados.isRenovacao,
            dadosProcessados.isDegustacao,
            'PIX (R$ 20,00)'
          )
        ]);

        return res.status(200).json({
          status: 'success',
          method: 'pix',
          license: dadosProcessados.chaveUso,
          valid_until: dadosProcessados.dataValidadeFormatada
        });

      } catch (ex) {
        console.error('❌ Erro ao processar webhook do Pix:', ex);
        return res.status(500).json({ status: 'error', detalhe: ex.message });
      }
    }
  }

  // 🎯 4. FATURA BEM-SUCEDIDA (Assinatura de Cartão)
  if (eventType === 'invoice.payment_succeeded') {
    const invoice = event.data.object;

    let subscriptionMetadata = {};
    if (invoice.subscription) {
      try {
        const subObj = await stripe.subscriptions.retrieve(invoice.subscription);
        subscriptionMetadata = subObj.metadata || {};
      } catch (e) {
        console.warn('⚠️ Não foi possível buscar metadados da assinatura:', e.message);
      }
    }

    const metadata = { ...invoice.metadata, ...subscriptionMetadata };
    const lineItemMetadata = invoice.lines?.data?.[0]?.metadata || {};

    const nome = metadata.nome || lineItemMetadata.nome || invoice.customer_name || '';
    const matricula = (metadata.matricula || lineItemMetadata.matricula || '').trim();

    let customerEmail = invoice.customer_email || metadata.email || lineItemMetadata.email || '';
    customerEmail = customerEmail.trim().toLowerCase();

    const whatsapp = (
      metadata.whatsapp || 
      lineItemMetadata.whatsapp || 
      invoice.customer_shipping?.phone || 
      invoice.customer_phone || 
      ''
    ).trim();

    const isTrialInvoice = invoice.total === 0 && (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle');
    let isDegustacao = isTrialInvoice;

    const isDadosInvalidos = !matricula && (!customerEmail || customerEmail === 'cliente desconhecido') && !nome;
    if (isDadosInvalidos) {
      return res.status(200).json({ status: 'ignored', reason: 'Missing customer identification metadata' });
    }

    try {
      let diasValidade = isDegustacao ? 3 : 30;

      const dadosProcessados = await processarLiberacaoLicenca(supabase, {
        matricula,
        nome,
        customerEmail,
        whatsapp,
        diasValidade,
        isDegustacao
      });

      await Promise.allSettled([
        enviarEmailJS(dadosProcessados.customerEmail, dadosProcessados.nome, dadosProcessados.chaveUso, dadosProcessados.dataValidadeFormatada, dadosProcessados.statusEmail),
        enviarWebhookDiscord(
          dadosProcessados.chaveUso,
          dadosProcessados.customerEmail || 'Não informado',
          dadosProcessados.nome,
          dadosProcessados.colaboradorFormatado,
          dadosProcessados.whatsapp,
          dadosProcessados.dataAquisicaoFormatada,
          dadosProcessados.dataValidadeFormatada,
          dadosProcessados.isRenovacao,
          dadosProcessados.isDegustacao,
          'Cartão de Crédito'
        )
      ]);

      return res.status(200).json({
        status: 'success',
        tipo: dadosProcessados.statusEmail,
        license: dadosProcessados.chaveUso,
        valid_until: dadosProcessados.dataValidadeFormatada,
      });

    } catch (ex) {
      console.error('❌ Erro no processamento do webhook com Supabase:', ex);
      return res.status(500).json({ status: 'error', detalhe: ex.message });
    }
  }

  return res.status(200).json({ status: 'ignored', event: eventType });
}
