import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Permite apenas método POST (já que o app vai enviar a chave no corpo da requisição)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { chave } = req.body;

    // Valida se a chave foi enviada
    if (!chave) {
      return res.status(400).json({ error: 'A chave de licença não foi informada.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Busca a licença e os dados do colaborador correspondente usando relacionamento
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

    // Se a chave não existir no banco
    if (!licencaData) {
      return res.status(404).json({ 
        status: 'error', 
        mensagem: 'Chave de licença não encontrada.' 
      });
    }

    // Verifica se a licença está ativa (considerando a grafia 'ativa' do seu banco)
    if (licencaData.status !== 'ativa') {
      return res.status(403).json({ 
        status: 'error', 
        mensagem: `Licença com status inválido: ${licencaData.status}` 
      });
    }

    // Valida se a licença está vinculada a algum colaborador
    if (!licencaData.colaboradores) {
      return res.status(400).json({ 
        status: 'error', 
        mensagem: 'Esta chave não está vinculada a nenhum colaborador.' 
      });
    }

    const colaborador = licencaData.colaboradores;

    // Retorna os dados necessários para o aplicativo estruturar o device_id e liberar o uso
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
