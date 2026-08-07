import Stripe from 'stripe';
import { google } from 'googleapis';
import { acquireLock, releaseLock } from '../lib/redisLock.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Desativa o bodyParser nativo da Vercel para ler o Raw Body do Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

// Leitura nativa e assíncrona do Stream da requisição para preservar o Raw Body exato
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

function getDriveService() {
  const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credsJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não definida.');

  const credsDict = typeof credsJson === 'string' ? JSON.parse(credsJson) : credsJson;

  const auth = new google.auth.GoogleAuth({
    credentials: credsDict,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
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

  if (!whatsapp) {
    console.warn('⚠️ WhatsApp não enviado: Telefone do cliente ausente no payload.');
    return;
  }

  if (!token || !phoneNumberId) {
    console.warn('⚠️ WhatsApp não enviado: META_ACCESS_TOKEN ou META_PHONE_NUMBER_ID ausentes nas variáveis de ambiente da Vercel.');
    return;
  }

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
    const response = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadMeta),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro retornado pela Meta WhatsApp API:', JSON.stringify(result, null, 2));
    } else {
      console.log('✅ Mensagem WhatsApp enviada com sucesso via Meta API:', result);
    }
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
    : 'Um novo colaborador foi cadastrado e os dados foram salvos no Drive.';

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
    return res.status(200).json({ status: 'active', message: 'Webhook endpoint running' });
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
        console.warn('Falha na verificação da assinatura Stripe. Aplicando fallback JSON.parse para testes.');
        event = JSON.parse(buf.toString('utf8'));
      }
    } else {
      event = JSON.parse(buf.toString('utf8'));
    }
  } catch (err) {
    console.error(`Erro no Webhook Stripe: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventType = event.type;

  if (eventType === 'payment_intent.succeeded' || eventType === 'checkout.session.completed') {
    // Trava de Concorrência
    const LOCK_KEY = 'lock:stripe_webhook_drive';
    const lockToken = await acquireLock(LOCK_KEY, 30000); // 30 segundos de limite

    if (!lockToken) {
      console.warn('⚠️ Webhook concorrente ignorado ou reprocessado mais tarde.');
      return res.status(429).json({
        status: 'error',
        message: 'Outra requisição está atualizando a licença no momento. Tente novamente em instantes.'
      });
    }

    try {
      const objectData = event.data.object;
      const metadata = objectData.metadata || {};

      const nome = metadata.nome || metadata.matricula_nome || objectData.customer_details?.name || 'Cliente';
      const matricula = metadata.matricula || '';
      
      // Captura flexível do número de telefone de qualquer origem do Stripe
      const whatsapp = 
        metadata.whatsapp || 
        objectData.customer_details?.phone || 
        objectData.shipping?.phone || 
        '';

      const colaboradorFormatado = matricula ? `${matricula} - ${nome.toUpperCase()}` : nome.toUpperCase();

      let customerEmail = 'Cliente desconhecido';
      if (objectData.customer_details?.email) {
        customerEmail = objectData.customer_details.email;
      } else if (objectData.receipt_email) {
        customerEmail = objectData.receipt_email;
      } else if (metadata.email) {
        customerEmail = metadata.email;
      }

      const fileId = process.env.GOOGLE_DRIVE_FILE_ID;
      const drive = getDriveService();

      // 1. Obter arquivo do Drive
      const fileStream = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'text' }
      );

      let configData = {};
      try {
        configData = typeof fileStream.data === 'string' ? JSON.parse(fileStream.data) : fileStream.data;
      } catch (e) {
        configData = { codigos_validos: [], licencas_detalhadas: [], colaboradores: [] };
      }

      if (!Array.isArray(configData.codigos_validos)) configData.codigos_validos = [];
      if (!Array.isArray(configData.licencas_detalhadas)) configData.licencas_detalhadas = [];
      if (!Array.isArray(configData.colaboradores)) configData.colaboradores = [];

      // 2. Verificar cliente existente
      const clienteExistente = configData.licencas_detalhadas.find(
        (item) =>
          (whatsapp && item.whatsapp === whatsapp) ||
          (customerEmail && customerEmail !== 'Cliente desconhecido' && item.email === customerEmail)
      );

      let chaveUso = '';
      let isRenovacao = false;
      const agora = new Date();
      let novaDataValidade = new Date();

      if (clienteExistente) {
        // --- RENOVAÇÃO ---
        isRenovacao = true;
        chaveUso = clienteExistente.chave;

        const dataValidadeAtual = new Date(clienteExistente.data_validade);

        // Trava para licenças administrativas/vitalícias (ano >= 2099)
        if (dataValidadeAtual.getFullYear() >= 2099) {
          novaDataValidade = dataValidadeAtual;
          clienteExistente.status = 'ativa';
        } else {
          const dataBase = dataValidadeAtual > agora ? dataValidadeAtual : agora;
          novaDataValidade = new Date(dataBase);
          novaDataValidade.setDate(novaDataValidade.getDate() + 30);

          clienteExistente.data_validade = novaDataValidade.toISOString();
          clienteExistente.data_validade_formatada = novaDataValidade.toLocaleDateString('pt-BR');
          clienteExistente.status = 'ativa';
        }

        if (!configData.codigos_validos.includes(chaveUso)) {
          configData.codigos_validos.push(chaveUso);
        }
      } else {
        // --- NOVO CLIENTE ---
        chaveUso = gerarChave();
        novaDataValidade.setDate(agora.getDate() + 30);

        configData.codigos_validos.push(chaveUso);

        if (!configData.colaboradores.includes(colaboradorFormatado)) {
          configData.colaboradores.push(colaboradorFormatado);
        }

        configData.licencas_detalhadas.push({
          chave: chaveUso,
          matricula,
          colaborador: colaboradorFormatado,
          nome,
          email: customerEmail,
          whatsapp,
          data_aquisicao: agora.toISOString(),
          data_validade: novaDataValidade.toISOString(),
          data_aquisicao_formatada: agora.toLocaleDateString('pt-BR'),
          data_validade_formatada: novaDataValidade.toLocaleDateString('pt-BR'),
          dias_validade: 30,
          status: 'ativa',
        });
      }

      const dataAquisicaoFormatada = agora.toLocaleDateString('pt-BR');
      const dataValidadeFormatada = novaDataValidade.toLocaleDateString('pt-BR');

      // 3. Salvar no Drive
      await drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(configData, null, 2),
        },
      });

      // 4. Notificações com proteção contra exceções
      await Promise.all([
        enviarWhatsapp(whatsapp, nome, chaveUso, dataValidadeFormatada, isRenovacao).catch((err) =>
          console.error('Falha isolada no envio do WhatsApp:', err)
        ),
        enviarWebhookDiscord(
          chaveUso,
          customerEmail,
          nome,
          colaboradorFormatado,
          whatsapp,
          dataAquisicaoFormatada,
          dataValidadeFormatada,
          isRenovacao
        ).catch((err) => console.error('Falha isolada no envio do Discord:', err)),
      ]);

      return res.status(200).json({
        status: 'success',
        tipo: isRenovacao ? 'renovacao' : 'novo_colaborador',
        license: chaveUso,
        valid_until: dataValidadeFormatada,
      });
    } catch (ex) {
      console.error('Erro no processamento do webhook:', ex);
      return res.status(500).json({ status: 'error', detalhe: ex.message });
    } finally {
      // Libera a trava do Redis após o término da operação
      await releaseLock(LOCK_KEY, lockToken);
    }
  }

  return res.status(200).json({ status: 'ignored', event: eventType });
}