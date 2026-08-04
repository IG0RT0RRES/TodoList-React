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

async function enviarWhatsapp(whatsapp, nome, licenseKey, dataValidadeFormatada, isRenovacao) {
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappToken = process.env.WHATSAPP_TOKEN;

  if (!whatsapp || !whatsappApiUrl) return;

  const mensagem = isRenovacao
    ? `Olá, *${nome}*! Sua assinatura foi *renovada* com sucesso! 🔄\n\n` +
      `Sua chave de acesso continua a mesma: *${licenseKey}*\n` +
      `Nova validade da licença: *${dataValidadeFormatada}*\n\n` +
      `Seu acesso no aplicativo já foi reativado/estendido automaticamente.`
    : `Olá, *${nome}*! Seu pagamento foi confirmado com sucesso. 🚀\n\n` +
      `Sua chave de acesso ao *Gestor de Baixas* é: *${licenseKey}*\n` +
      `Validade da licença: *${dataValidadeFormatada}* (30 dias)\n\n` +
      `Guarde bem este código para realizar seus logins no aplicativo.`;

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

async function enviarWebhookDiscord(licenseKey, customerEmail, nome, whatsapp, dataAquisicao, dataValidade, isRenovacao) {
  const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const titulo = isRenovacao ? 'Licença Renovada (+30 Dias)' : 'Nova Licença Gerada (30 Dias)';
  const descricao = isRenovacao
    ? 'Um pagamento de renovação foi processado e a validade da chave existente foi estendida.'
    : 'Um pagamento foi confirmado e os dados do novo comprador foram salvos no Drive.';

  const payload = {
    username: 'Stripe Pix Bot',
    content: isRenovacao ? 'Renovação de licença concluída!' : 'Novo pagamento processado com sucesso!',
    embeds: [
      {
        title: titulo,
        description: descricao,
        color: isRenovacao ? 3066993 : 16711680, // Verde para renovação, Vermelho/Laranja para nova
        fields: [
          { name: 'Código de Acesso', value: licenseKey, inline: true },
          { name: 'Tipo', value: isRenovacao ? 'Renovação' : 'Nova Compra', inline: true },
          { name: 'Usuário', value: nome, inline: false },
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

      if (!Array.isArray(configData.codigos_validos)) {
        configData.codigos_validos = [];
      }
      if (!Array.isArray(configData.licencas_detalhadas)) {
        configData.licencas_detalhadas = [];
      }

      // 2. Verificar se o cliente já possui um cadastro (Renovação vs Nova Licença)
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
        // --- FLUXO DE RENOVAÇÃO ---
        isRenovacao = true;
        chaveUso = clienteExistente.chave;

        // Se a licença atual ainda não expirou, adiciona 30 dias a partir da data de validade atual.
        // Se já expirou, adiciona 30 dias a partir de hoje.
        const dataValidadeAtual = new Date(clienteExistente.data_validade);
        const dataBase = dataValidadeAtual > agora ? dataValidadeAtual : agora;

        novaDataValidade = new Date(dataBase);
        novaDataValidade.setDate(novaDataValidade.getDate() + 30);

        // Atualizar os campos do cliente existente
        clienteExistente.data_validade = novaDataValidade.toISOString();
        clienteExistente.data_validade_formatada = novaDataValidade.toLocaleDateString('pt-BR');
        clienteExistente.status = 'ativa';
        clienteExistente.nome = nome || clienteExistente.nome;

        // Garantir que a chave esteja presente no array de códigos válidos
        if (!configData.codigos_validos.includes(chaveUso)) {
          configData.codigos_validos.push(chaveUso);
        }
      } else {
        // --- FLUXO DE NOVO CLIENTE ---
        chaveUso = gerarChave();
        novaDataValidade.setDate(agora.getDate() + 30);

        configData.codigos_validos.push(chaveUso);
        configData.licencas_detalhadas.push({
          chave: chaveUso,
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

      // 3. Persistir as alterações no Google Drive
      await drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(configData, null, 2),
        },
      });

      // 4. Disparar Notificações (WhatsApp e Discord)
      await Promise.all([
        enviarWhatsapp(whatsapp, nome, chaveUso, dataValidadeFormatada, isRenovacao),
        enviarWebhookDiscord(
          chaveUso,
          customerEmail,
          nome,
          whatsapp,
          dataAquisicaoFormatada,
          dataValidadeFormatada,
          isRenovacao
        ),
      ]);

      return res.status(200).json({
        status: 'success',
        tipo: isRenovacao ? 'renovacao' : 'nova_licenca',
        license: chaveUso,
        valid_until: dataValidadeFormatada,
      });
    } catch (ex) {
      console.error('Erro no processamento do webhook:', ex);
      return res.status(500).json({ status: 'error', detalhe: ex.message });
    }
  }

  return res.status(200).json({ status: 'ignored', event: eventType });
    }
    
