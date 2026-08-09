import { google } from 'googleapis';

export default async function handler(req, res) {
  // Configuração do CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const fileId = process.env.GOOGLE_DRIVE_FILE_ID_LEADERBOARD;

    if (!serviceAccountJson || !fileId) {
      return res.status(500).json({ error: 'Configuração de variáveis de ambiente ausente.' });
    }

    const credentials = JSON.parse(serviceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const fileStream = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    let data = '';
    fileStream.data.on('data', (chunk) => {
      data += chunk;
    });

    await new Promise((resolve, reject) => {
      fileStream.data.on('end', resolve);
      fileStream.data.on('error', reject);
    });

    const jsonData = JSON.parse(data);
    return res.status(200).json(jsonData);

  } catch (error) {
    console.error('Erro na rota /api/leaderboard:', error);
    return res.status(500).json({ error: 'Erro interno ao comunicar com o Google Drive.' });
  }
}