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
    cor_fundo: 'linear-gradient(135deg, #2563eb, #1d4ed8)', // Azul
    cor_borda: '#3b82f6',
    cor_texto: '#60a5fa',
    titulo_email: 'Acesso Liberado! 🚀',
    mensagem_corpo: 'Sua nova licença foi gerada com sucesso e já está pronta para uso no aplicativo.',
    conteudo_destaque: licenseKey,
    detalhe_rodape: `📅 Validade do Acesso: ${dataValidadeFormatada}`
  };

  if (tipoStatus === 'renovacao') {
    configuracao = {
      cor_fundo: 'linear-gradient(135deg, #059669, #047857)', // Verde
      cor_borda: '#10b981',
      cor_texto: '#34d399',
      titulo_email: 'Licença Renovada! 🔄',
      mensagem_corpo: 'O seu pagamento foi confirmado e a validade da sua licença foi estendida com sucesso.',
      conteudo_destaque: licenseKey,
      detalhe_rodape: `🗓️ Nova Validade: ${dataValidadeFormatada}`
    };
  } else if (tipoStatus === 'degustacao') {
    configuracao = {
      cor_fundo: 'linear-gradient(135deg, #7c3aed, #6d28d9)', // Roxo
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

async function enviarWebhookDiscord(licenseKey, customerEmail, nome, matriculaFormatada, whatsapp, dataAquisicao, dataValidade, isRenovacao, isDegustacao) {
  const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  let titulo = 'Nova Licença Gerada (30 Dias)';
  let descricao = 'Um novo colaborador foi cadastrado e salvo no Supabase.';
  let cor = 16711680; 
  let conteudoBot = 'Novo pagamento e acesso liberado!';

  if (isDegustacao) {
    titulo = '🎁 Licença de Degustação Gerada (3 Dias)';
    descricao = 'Período de teste grátis (trial) ativado para o colaborador.';
    cor = 3447003; 
    conteudoBot = '🎁 Novo teste grátis ativado!';
  } else if (isRenovacao) {
    titulo = 'Licença Renovada (+30 Dias)';
    descricao = 'Um pagamento de renovação foi processado e a validade da chave existente foi estendida.';
    cor = 3066993; 
    conteudoBot = 'Renovação de licença concluída!';
  }

  const tipoTexto = isDegustacao ? 'Degustação (3 Dias)' : (isRenovacao ? 'Renovação' : 'Novo Colaborador');

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
    username: 'Stripe Pix Bot',
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

  // 🎯 Agora escutamos o evento de Fatura Bem-Sucedida do Stripe
  if (eventType === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    
    // Nas assinaturas e faturas do Stripe, os metadados podem vir na subscription ou na invoice
    const metadata = invoice.metadata || invoice.parent?.subscription_details?.metadata || {};
    
    // Extrai dados do primeiro item da fatura se houver metadados lá também
    const lineItemMetadata = invoice.lines?.data?.[0]?.metadata || {};
    
    const nome = metadata.nome || lineItemMetadata.nome || invoice.customer_name || '';
    const matricula = metadata.matricula || lineItemMetadata.matricula || '';
    
    let customerEmail = invoice.customer_email || metadata.email || lineItemMetadata.email || '';
    customerEmail = customerEmail.trim().toLowerCase();

    const whatsapp = (
      metadata.whatsapp || 
      lineItemMetadata.whatsapp || 
      invoice.customer_shipping?.phone || 
      invoice.customer_phone || 
      ''
    ).trim();

    console.log('📦 DADOS DA FATURA DO STRIPE RECEBIDOS:', JSON.stringify({
      customer_email: customerEmail,
      nome,
      matricula,
      total: invoice.total,
      billing_reason: invoice.billing_reason,
      discount: invoice.total_discount_amounts,
      metadata
    }, null, 2));

    // 🔍 Detecção de Degustação na Fatura (Trial nativo do Stripe ou Cupons/Descontos)
    const isTrialInvoice = invoice.total === 0 && (invoice.billing_reason === 'subscription_create' || invoice.billing_reason === 'subscription_cycle');
    const temDescontoFatura = (invoice.total_discount_amounts && invoice.total_discount_amounts.length > 0) || (invoice.amount_remaining === 0 && invoice.subtotal > 0);
    const cupomMetadados = metadata.cupom === 'CAD2026' || lineItemMetadata.cupom === 'CAD2026';
    
    let isDegustacao = isTrialInvoice || temDescontoFatura || cupomMetadados;

    // Varre descontos aplicados nos itens da fatura
    const lineItems = invoice.lines?.data || [];
    for (const item of lineItems) {
      if (item.discount_amounts && item.discount_amounts.length > 0) {
        isDegustacao = true;
        break;
      }
    }

    const isDadosInvalidos = (!customerEmail || customerEmail === 'cliente desconhecido') && !nome && !matricula;
    if (isDadosInvalidos) {
      console.warn('⚠️ Webhook ignorado: Fatura do Stripe sem dados identificáveis do cliente.');
      return res.status(200).json({ status: 'ignored', reason: 'Missing customer identification metadata' });
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Credenciais do Supabase ausentes no servidor.');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // ⏱️ Se for degustação são 3 dias, caso contrário 30 dias de mensalidade
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
            equipe: metadata.equipe || null,
            projeto: metadata.projeto || null,
            supervisor: metadata.supervisor || null
          }).eq('id', colaboradorId);

        } else {
          const { data: novoColab, error: colabError } = await supabase
            .from('colaboradores')
            .insert([{
              matricula: matricula ? matricula.trim() : `TEMP_${Date.now()}`,
              nome: (nome || 'Cliente').toUpperCase(),
              email: customerEmail || null,
              equipe: metadata.equipe || null,
              projeto: metadata.projeto || null,
              supervisor: metadata.supervisor || null
            }])
            .select('id')
            .single();

          if (colabError) {
            console.error("Erro ao salvar colaborador no Supabase:", colabError);
            throw new Error("Erro ao salvar colaborador: " + colabError.message);
          }

          if (novoColab) {
            colaboradorId = novoColab.id;
          }
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
          // 🛠️ Se a licença anterior era 'degustacao' ou já expirou, renova contando a partir de AGORA
          // Se a licença atual é uma mensalidade normal ainda dentro do prazo, acumula +30 dias ao final dela
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
      } else {
        chaveUso = gerarChave();
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
          isRenovacao,
          isDegustacao
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
