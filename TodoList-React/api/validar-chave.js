import { google } from 'googleapis';

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

// Função auxiliar para disparar o webhook de notificação
async function dispararWebhook(conteudoMensagem) {
  const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return; // Se não houver webhook configurado, apenas ignora

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: conteudoMensagem,
      }),
    });
  } catch (error) {
    console.error('Erro ao disparar webhook:', error);
  }
}

export default async function handler(req, res) {
  // Configuração CORS para aceitar chamadas do seu app
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { chave, device_id } = req.body;

    if (!chave) {
      return res.status(400).json({ autorizado: false, motivo: 'Chave não informada.' });
    }

    if (!device_id) {
      return res.status(400).json({ autorizado: false, motivo: 'Identificador do dispositivo não informado.' });
    }

    const chaveFormatada = chave.trim().toUpperCase();
    const fileId = process.env.GOOGLE_DRIVE_FILE_ID_LICENCES;
    
    if (!fileId) {
      return res.status(500).json({ autorizado: false, motivo: 'Configuração do arquivo do Drive ausente no servidor.' });
    }

    const drive = getDriveService();

    // 1. Buscar o arquivo do Drive
    const fileStream = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'text' }
    );

    let configData = {};
    try {
      configData = typeof fileStream.data === 'string' ? JSON.parse(fileStream.data) : fileStream.data;
    } catch (e) {
      return res.status(500).json({ autorizado: false, motivo: 'Erro ao ler banco de dados.' });
    }

    const licencas = configData.licencas_detalhadas || [];
    const codigosValidos = configData.codigos_validos || [];

    // 2. Localizar a licença pelo código
    const indexLicenca = licencas.findIndex((item) => item.chave === chaveFormatada);

    // CASO 1: Chave não cadastrada na estrutura detalhada
    if (indexLicenca === -1) {
      // Fallback: Checa se existe no array simples 'codigos_validos' (compatibilidade antiga)
      const existeNoArraySimples = codigosValidos.includes(chaveFormatada);
      if (existeNoArraySimples) {
        // Dispara webhook informando o acesso via modo legado
        await dispararWebhook(`🔑 **Acesso ao App Realizado**\n- Licença: \`${chaveFormatada}\`\n- Modo: Legado (Array Simples)`);
        
        return res.status(200).json({
          autorizado: true,
          mensagem: 'Licença válida (Modo Legado).',
        });
      }

      return res.status(401).json({
        autorizado: seguindo => false,
        autorizado: false,
        motivo: 'Chave de acesso inválida ou não encontrada.',
      });
    }

    const licenca = licencas[indexLicenca];
    const agora = new Date();
    const dataValidade = new Date(licenca.data_validade);

    // CASO 2: Chave EXPIRADA ou INATIVA
    if (agora > dataValidade || licenca.status !== 'ativa') {
      // Atualiza o status para expirada se ainda não estiver
      configData.licencas_detalhadas[indexLicenca].status = 'expirada';
      configData.codigos_validos = codigosValidos.filter((code) => code !== chaveFormatada);

      // Atualizar o Google Drive persistindo a remoção/expiração
      await drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(configData, null, 2),
        },
      });

      return res.status(403).json({
        autorizado: false,
        status: 'expirada',
        motivo: `Sua licença expirou em ${licenca.data_validade_formatada}. Adquira um novo acesso.`,
      });
    }

    // CASO 3: Mecânica Anti-Compartilhamento (Vínculo de Device ID)
    if (!licenca.device_id) {
      // Primeiro uso: Vincula esta chave permanentemente ao device_id atual
      configData.licencas_detalhadas[indexLicenca].device_id = device_id;
      
      await drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(configData, null, 2),
        },
      });
    } else if (licenca.device_id !== device_id) {
      // Tentativa de uso em outro computador
      return res.status(403).json({
        autorizado: false,
        motivo: 'Esta licença já está vinculada a outro usuário. O compartilhamento não é permitido.',
      });
    }

    // CASO 4: Chave VÁLIDA e Dispositivo Autorizado -> Dispara o Webhook de sucesso no padrão solicitado
    const nomeUsuario = licenca.nome ? `\n- Nome: ${licenca.nome}` : '';
    await dispararWebhook(`🔑 **Acesso ao App Realizado**\n- Licença: \`${chaveFormatada}\`${nomeUsuario}\n- Validade: ${licenca.data_validade_formatada}`);

    return res.status(200).json({
      autorizado: true,
      status: 'ativa',
      usuario: licenca.nome,
      validade: licenca.data_validade_formatada,
      mensagem: 'Acesso autorizado.',
    });
  } catch (error) {
    console.error('Erro ao validar chave:', error);
    return res.status(500).json({ autorizado: false, motivo: 'Erro interno no servidor de validação.' });
  }
}
