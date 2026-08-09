import Stripe from 'stripe';
import { google } from 'googleapis';
import { acquireLock, releaseLock } from '../lib/redisLock.js';

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
    : 'Um novo colaborador foi cadastrado e os arquivos do Drive foram atualizados.';

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

    const LOCK_KEY = 'lock:stripe_webhook_drive_dual';
    const lockToken = await acquireLock(LOCK_KEY, 30000);

    if (!lockToken) {
      return res.status(429).json({
        status: 'error',
        message: 'Outra requisição está atualizando as licenças no momento.'
      });
    }

    try {
      const whatsapp = 
        metadata.whatsapp || 
        objectData.customer_details?.phone || 
        objectData.shipping?.phone || 
        '';

      const colaboradorFormatado = matricula ? `${matricula} - ${nome.toUpperCase()}` : (nome ? nome.toUpperCase() : 'CLIENTE');

      const fileIdLicenses = process.env.GOOGLE_DRIVE_FILE_ID_LICENCES;
      const fileIdConfig = process.env.GOOGLE_DRIVE_FILE_ID;
      const drive = getDriveService();

      // 1. Ler licenses.json
      const streamLicenses = await drive.files.get({ fileId: fileIdLicenses, alt: 'media' }, { responseType: 'text' });
      let licensesData = {};
      try {
        licensesData = typeof streamLicenses.data === 'string' ? JSON.parse(streamLicenses.data) : streamLicenses.data;
      } catch (e) {
        licensesData = { codigos_validos: [], licencas_detalhadas: [] };
      }

      if (!Array.isArray(licensesData.codigos_validos)) licensesData.codigos_validos = [];
      if (!Array.isArray(licensesData.licencas_detalhadas)) licensesData.licencas_detalhadas = [];

      // 2. Ler Config.json
      const streamConfig = await drive.files.get({ fileId: fileIdConfig, alt: 'media' }, { responseType: 'text' });
      let configData = {};
      try {
        configData = typeof streamConfig.data === 'string' ? JSON.parse(streamConfig.data) : streamConfig.data;
      } catch (e) {
        configData = { supervisores: [], colaboradores: [], equipes: [], projetos: [] };
      }

      if (!Array.isArray(configData.colaboradores)) configData.colaboradores = [];

      // Verificar se cliente já existe nas licenças
      const clienteExistente = licensesData.licencas_detalhadas.find(
        (item) =>
          (matricula && item.matricula && item.matricula.trim() === matricula.trim()) ||
          (customerEmail && customerEmail !== 'Cliente desconhecido' && item.email === customerEmail)
      );

      let chaveUso = '';
      let isRenovacao = false;
      const agora = new Date();
      let novaDataValidade = new Date();

      if (clienteExistente) {
        isRenovacao = true;
        chaveUso = clienteExistente.chave;

        const dataValidadeAtual = new Date(clienteExistente.data_validade);

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

        if (!licensesData.codigos_validos.includes(chaveUso)) {
          licensesData.codigos_validos.push(chaveUso);
        }
      } else {
        chaveUso = gerarChave();
        novaDataValidade.setDate(agora.getDate() + 30);

        licensesData.codigos_validos.push(chaveUso);

        licensesData.licencas_detalhadas.push({
          chave: chaveUso,
          matricula,
          colaborador: colaboradorFormatado,
          nome: nome || 'Cliente',
          email: customerEmail || 'Cliente desconhecido',
          whatsapp,
          device_id: null,
          data_aquisicao: agora.toISOString(),
          data_validade: novaDataValidade.toISOString(),
          data_aquisicao_formatada: agora.toLocaleDateString('pt-BR'),
          data_validade_formatada: novaDataValidade.toLocaleDateString('pt-BR'),
          dias_validade: 30,
          status: 'ativa',
        });
      }

      // Adiciona o colaborador no Config.json caso ainda não exista
      if (!configData.colaboradores.includes(colaboradorFormatado)) {
        configData.colaboradores.push(colaboradorFormatado);
      }

      const dataAquisicaoFormatada = agora.toLocaleDateString('pt-BR');
      const dataValidadeFormatada = novaDataValidade.toLocaleDateString('pt-BR');

      // Salvar atualizações no Google Drive (ambos os arquivos)
      await Promise.all([
        drive.files.update({
          fileId: fileIdLicenses,
          media: {
            mimeType: 'application/json',
            body: JSON.stringify(licensesData, null, 2),
          },
        }),
        drive.files.update({
          fileId: fileIdConfig,
          media: {
            mimeType: 'application/json',
            body: JSON.stringify(configData, null, 2),
          },
        })
      ]);

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
      console.error('Erro no processamento do webhook:', ex);
      return res.status(500).json({ status: 'error', detalhe: ex.message });
    } finally {
      await releaseLock(LOCK_KEY, lockToken);
    }
  }

  return res.status(200).json({ status: 'ignored', event: eventType });
}