import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Aceita tanto POST quanto GET para facilitar testes no navegador
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Use POST ou GET.' });
  }

  try {
    // Pega a chave do body (se for POST) ou da URL/query string (se for GET)
    const chave = req.method === 'POST' ? req.body.chave : req.query.chave;

    // Valida se a chave foi informada
    if (!chave) {
      return res.status(400).json({ error: 'A chave de licença não foi informada.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Busca a licença e os dados do colaborador correspondente
    const { data: licencaData, error: errLicenca } = await supabase
      .from('licencas')
      .select(`
        id,
        chave,
        status,
        device_id,
        colaboradores (
          id,
          matricula,
          nome
        )
      `)
      .eq('chave', chave.trim())
      .maybeSingle();

    if (errLicenca) {
      throw new Error(`Erro ao consultar licença: ${errLicenca.message}`);
    }

    if (!licencaData) {
      return res.status(404).json({ 
        status: 'error', 
        mensagem: 'Chave de licença não encontrada.' 
      });
    }

    if (licencaData.status !== 'ativa') {
      return res.status(403).json({ 
        status: 'error', 
        mensagem: `Licença com status inválido: ${licencaData.status}` 
      });
    }

    if (!licencaData.colaboradores) {
      return res.status(400).json({ 
        status: 'error', 
        mensagem: 'Esta chave não está vinculada a nenhum colaborador.' 
      });
    }

    const colaborador = licencaData.colaboradores;

    return res.status(200).json({
      status: 'sucesso',
      mensagem: 'Licença válida e ativa!',
      dados: {
        licenca_id: licencaData.id,
        colaborador_id: colaborador.id,
        matricula: colaborador.matricula,
        nome: colaborador.nome,
        device_id_cadastrado: licencaData.device_id
      }
    });

  } catch (err) {
    console.error('Erro na validação da licença:', err.message);
    return res.status(500).json({ 
      status: 'error', 
      mensagem: 'Erro interno no servidor ao validar a licença.',
      detalhe: err.message 
    });
  }
}
