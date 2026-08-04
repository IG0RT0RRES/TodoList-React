import { buffer } from 'micro';
import Stripe from 'stripe';
import { google } from 'googleapis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

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

async function enviarWhatsapp(whatsapp, nome, licenseKey, dataValidadeFormatada) {
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappToken = process.env.WHATSAPP_TOKEN;

  if (!whatsapp || !whatsappApiUrl) return;

  const mensagem =
    `Olá, *${nome}*! Seu pagamento foi confirmado com sucesso. 🚀\n\n` +
    `Sua chave de acesso ao *Gestor de Baixas* é: *${licenseKey}*\n` +
    `Validade da licença: *${dataValidadeFormatada}* (30 dias)\n\n` +
    `Guarde bem este código para realizar seus logins.`;

  const headers = { 'Content-Type': 'application/json' };
  if (whatsappToken) {
    headers['Authorization'] = `Bearer ${whatsappToken}`;
  }

  try {
    await fetch(whatsappApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: whatsapp, message: mensagem }),
    });
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
  }
}

async function enviarWebhookDiscord(licenseKey, customerEmail, nome, whatsapp, dataAquisicao, dataValidade) {
  const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    username: 'Stripe Pix Bot',
    content: 'Novo pagamento processado com sucesso!',
    embeds: [
      {
        title: 'Nova Licença Gerada (30 Dias)',
        description: 'Um pagamento foi confirmado e os dados do comprador foram salvos no Drive.',
        color: 16711680,
        fields: [
          { name: 'Código de Acesso', value: licenseKey, inline: true },
          { name: 'Usuário', value: nome, inline: false },
          { name: 'WhatsApp', value: whatsapp || 'Não informado', inline: true },
          { name: 'E-mail', value: customerEmail, inline: true },
          { name: 'Data de Aquisição', value: dataAquisicao, inline: true },
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

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } else {
      event = JSON.parse(buf.toString());
    }
  } catch (err) {
    console.error(`Erro no Webhook Stripe: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventType = event.type;

  if (eventType === 'payment_intent.succeeded' || eventType === 'checkout.session.completed') {
    try {
      const objectData = event.data.object;
      const metadata = objectData.metadata || {};

      const nome = metadata.nome || metadata.matricula_nome || 'Cliente';
      const whatsapp = metadata.whatsapp || '';

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

      // 1. Obter o arquivo de configuração do Drive
      const fileStream = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'text' }
      );

      let configData = {};
      try {
        configData = typeof fileStream.data === 'string' ? JSON.parse(fileStream.data) : fileStream.data;
      } catch (e) {
        configData = { codigos_validos: [], licencas_detalhadas: [] };
      }

      // 2. Gerar a chave e calcular as datas (30 dias)
      const novaChave = gerarChave();
      
      const agora = new Date();
      const dataValidadeObj = new Date();
      dataValidadeObj.setDate(agora.getDate() + 30);

      const dataAquisicaoISO = agora.toISOString();
      const dataValidadeISO = dataValidadeObj.toISOString();

      const dataAquisicaoFormatada = agora.toLocaleDateString('pt-BR');
      const dataValidadeFormatada = dataValidadeObj.toLocaleDateString('pt-BR');

      // 3. Atualizar array simples e salvar objeto detalhado do comprador
      if (!Array.isArray(configData.codigos_validos)) {
        configData.codigos_validos = [];
      }
      configData.codigos_validos.push(novaChave);

      if (!Array.isArray(configData.licencas_detalhadas)) {
        configData.licencas_detalhadas = [];
      }

      const registroComprador = {
        chave: novaChave,
        nome,
        email: customerEmail,
        whatsapp,
        data_aquisicao: dataAquisicaoISO,
        data_validade: dataValidadeISO,
        data_aquisicao_formatada: dataAquisicaoFormatada,
        data_validade_formatada: dataValidadeFormatada,
        dias_validade: 30,
        status: 'ativa'
      };

      configData.licencas_detalhadas.push(registroComprador);

      // 4. Salvar no Google Drive
      await drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(configData, null, 2),
        },
      });

      // 5. Enviar notificações
      await Promise.all([
        enviarWhatsapp(whatsapp, nome, novaChave, dataValidadeFormatada),
        enviarWebhookDiscord(novaChave, customerEmail, nome, whatsapp, dataAquisicaoFormatada, dataValidadeFormatada),
      ]);

      return res.status(200).json({
        status: 'success',
        license: novaChave,
        valid_until: dataValidadeFormatada
      });
    } catch (ex) {
      console.error('Erro no processamento do webhook:', ex);
      return res.status(500).json({ status: 'error', detalhe: ex.message });
    }
  }

  return res.status(200).json({ status: 'ignored', event: eventType });
    }
