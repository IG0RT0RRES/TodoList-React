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

async function enviarEmailJS(customerEmail, nome, licenseKey, dataValidadeFormatada) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) return;
  if (!customerEmail) return;

  const emailJsUrl = 'https://api.emailjs.com/api/v1.0/email/send';

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: customerEmail,
      to_name: nome,
      license_key: licenseKey,
      validade: dataValidadeFormatada
    }
  };

  try {
    const response = await fetch(emailJsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta do EmailJS:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Erro na requisição para EmailJS:', error);
  }
}

async function enviarWebhookDiscord(licenseKey, customerEmail, nome, matriculaFormatada, whatsapp, dataAquisicao, dataValidade, isRenovacao, isDegustacao, isBloqueado = false) {
  const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  let titulo = 'Nova Licença Gerada (30 Dias)';
  let descricao = 'Um novo colaborador foi cadastrado e salvo no Supabase.';
  let cor = 16711680; // Vermelho/Laranja
  let conteudoBot = 'Novo pagamento e acesso liberado!';

  if (isBloqueado) {
    titulo = '🛑 Tentativa de Abuso Bloqueada';
    descricao = 'O usuário tentou reutilizar o cupom de degustação, mas já possui histórico de licenças.';
    cor = 15158332; // Vermelho escuro de alerta
    conteudoBot = '⚠️ Alerta de Segurança: Tentativa de reuso de degustação barrada!';
  } else if (isDegustacao) {
    titulo = '🎁 Licença de Degustação Gerada (3 Dias)';
    descricao = 'Cupom CAD2026 aplicado! Licença de teste grátis gerada para o colaborador.';
    cor = 3447003; // Azul
    conteudoBot = '🎁 Novo teste grátis ativado!';
  } else if (isRenovacao) {
    titulo = 'Licença Renovada (+30 Dias)';
    descricao = 'Um pagamento de renovação foi processado e a validade da chave existente foi estendida.';
    cor = 3066993; // Verde
    conteudoBot = 'Renovação de licença concluída!';
  }

  const tipoTexto = isBloqueado ? 'Bloqueado (Reuso de Degustação)' : (isDegustacao ? 'Degustação (3 Dias)' : (isRenovacao ? 'Renovação' : 'Novo Colaborador'));

  const fields = [
    { name: 'Tipo', value: tipoTexto, inline: true },
    { name: 'Colaborador', value: matriculaFormatada || nome, inline: false },
    { name: 'WhatsApp', value: whatsapp || 'Não informado', inline: true },
    { name: 'E-mail', value: customerEmail, inline: true },
    { name: 'Data da Operação', value: dataAquisicao, inline: true },
  ];

  if (!isBloqueado) {
    fields.push({ name: 'Código de Acesso', value: licenseKey, inline: true });
    fields.push({ name: 'Válido até', value: dataValidade, inline: true });
  }

  const payload = {
    username: 'Stripe Pix Bot',
    content: conteudoBot,
    embeds: [
      {
        title: titulo,
        description: descricao,
        color: cor,
        fields: fields,
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

    console.log('📦 DADOS DO STRIPE RECEBIDOS:', JSON.stringify({
      total_details: objectData.total_details,
      discount: objectData.discount,
      discounts: objectData.discounts,
      metadata: objectData.metadata
    }, null, 2));

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

    const whatsapp = 
      metadata.whatsapp || 
      objectData.customer_details?.phone || 
      objectData.shipping?.phone || 
      '';

    const houveDesconto = objectData.total_details?.amount_discount > 0;
    const cupomMetadados = metadata.cupom === 'CAD2026';

    let isDegustacao = houveDesconto || cupomMetadados;

    const breakdownDiscounts = objectData.total_details?.breakdown?.discounts;
    if (!isDegustacao && Array.isArray(breakdownDiscounts) && breakdownDiscounts.length > 0) {
      for (const d of breakdownDiscounts) {
        const couponId = d.discount?.coupon?.id || d.coupon?.id || d.id;
        if (couponId === 'CAD2026') {
          isDegustacao = true;
          break;
        }
      }
    }

    const isDadosInvalidos = (!customerEmail || customerEmail === 'Cliente desconhecido') && !nome && !matricula;
    if (isDadosInvalidos) {
      console.warn('⚠️ Webhook ignorado: Evento do Stripe sem dados identificáveis do cliente.');
      return res.status(200).json({ status: 'ignored', reason: 'Missing customer identification metadata' });
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Credenciais do Supabase ausentes no servidor.');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // 🛑 TRAVA ANTI-ABUSO BLINDADA COM ALERTA NO DISCORD
      if (isDegustacao && (customerEmail || whatsapp)) {
        let colabIdEncontrado = null;
        if (customerEmail) {
          const { data: colabData } = await supabase
            .from('colaboradores')
            .select('id')
            .eq('email', customerEmail.trim())
            .maybeSingle();
          if (colabData) colabIdEncontrado = colabData.id;
        }

        let queryVerificacao = supabase.from('licencas').select('id, tipo');
        const condicoes = [];
        if (colabIdEncontrado) condicoes.push(`colaborador_id.eq.${colabIdEncontrado}`);
        if (whatsapp) condicoes.push(`whatsapp.eq.${whatsapp.trim()}`);

        if (condicoes.length > 0) {
          queryVerificacao = queryVerificacao.or(condicoes.join(','));
          const { data: licencaAnterior } = await queryVerificacao;

          if (licencaAnterior && licencaAnterior.length > 0) {
            console.warn(`🛑 TENTATIVA DE ABUSO BLOQUEADA: O usuário ${customerEmail} / ${whatsapp} já possui histórico de licenças.`);
            
            // Dispara notificação de alerta para o Discord informando o bloqueio
            const agora = new Date();
            const dataAquisicaoFormatada = agora.toLocaleDateString('pt-BR');
            const colaboradorFormatado = matricula ? `${matricula} - ${(nome || '').toUpperCase()}` : (nome ? nome.toUpperCase() : 'CLIENTE');

            await enviarWebhookDiscord(
              '',
              customerEmail || 'Não informado',
              nome || 'Cliente',
              colaboradorFormatado,
              whatsapp,
              dataAquisicaoFormatada,
              '',
              false,
              true,
              true // isBloqueado = true
            ).catch(() => {});

            return res.status(200).json({ 
              status: 'blocked', 
              message: "Cupom de degustação restrito apenas a novos clientes." 
            });
          }
        }
      }

      let diasValidade = isDegustacao ? 3 : 30;
      const tipoLicenca = isDegustacao ? 'degustacao' : 'mensal';

      let colaboradorId = null;

      if (matricula || customerEmail) {
        const filtros = [];
        if (matricula) filtros.push(`matricula.eq.${matricula.trim()}`);
        if (customerEmail) filtros.push(`email.eq.${customerEmail.trim()}`);

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
          novaDataValidade.setDate(novaDataValidade.getDate() + diasValidade);
        }

        const { error: updateError } = await supabase
          .from('licencas')
          .update({
            data_validade: novaDataValidade.toISOString(),
            status: 'ativa',
            tipo: tipoLicenca
          })
          .eq('chave', chaveUso);

        if (updateError) {
          console.error("Erro ao atualizar licença existente:", updateError);
          throw new Error("Erro ao atualizar licença: " + updateError.message);
        }

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

      const dataAquisicaoFormatada = agora.toLocaleDateString('pt-BR');
      const dataValidadeFormatada = novaDataValidade.toLocaleDateString('pt-BR');
      const colaboradorFormatado = matricula ? `${matricula} - ${(nome || '').toUpperCase()}` : (nome ? nome.toUpperCase() : 'CLIENTE');

      await Promise.all([
        enviarEmailJS(customerEmail, nome || 'Cliente', chaveUso, dataValidadeFormatada).catch(() => {}),
        enviarWebhookDiscord(
          chaveUso,
          customerEmail || 'Não informado',
          nome || 'Cliente',
          colaboradorFormatado,
          whatsapp,
          dataAquisicaoFormatada,
          dataValidadeFormatada,
          isRenovacao,
          isDegustacao,
          false
        ).catch(() => {}),
      ]);

      return res.status(200).json({
        status: 'success',
        tipo: isDegustacao ? 'degustacao' : (isRenovacao ? 'renovacao' : 'novo_colaborador'),
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
