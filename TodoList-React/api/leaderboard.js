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

export default async function handler(req, res) {
  // Configuração CORS para aceitar requisições do seu front-end
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const fileId = process.env.GOOGLE_DRIVE_FILE_ID_LEADERBOARD;

    if (!fileId) {
      return res.status(500).json({ error: 'GOOGLE_DRIVE_FILE_ID_LEADERBOARD não configurada nas variáveis de ambiente.' });
    }

    const drive = getDriveService();

    // 1. OBTENÇÃO DO RANKING (GET)
    if (req.method === 'GET') {
      const fileStream = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'text' }
      );

      let leaderboardData = {};
      try {
        leaderboardData = typeof fileStream.data === 'string' ? JSON.parse(fileStream.data) : fileStream.data;
      } catch (e) {
        return res.status(500).json({ error: 'Erro ao interpretar o JSON do ranking.' });
      }

      return res.status(200).json(leaderboardData);
    }

    // 2. ATUALIZAÇÃO DO RANKING (POST) - Opcional para escrita
    if (req.method === 'POST') {
      const bodyData = req.body;

      if (!bodyData) {
        return res.status(400).json({ error: 'Nenhum dado enviado para atualização.' });
      }

      await drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData, null, 2),
        },
      });

      return res.status(200).json({ success: true, mensagem: 'Ranking atualizado no Google Drive com sucesso.' });
    }

    return res.status(405).json({ error: 'Método não permitido.' });

  } catch (error) {
    console.error('Erro na rota /api/leaderboard:', error);
    return res.status(500).json({ error: 'Erro interno ao comunicar com o Google Drive.' });
  }
}