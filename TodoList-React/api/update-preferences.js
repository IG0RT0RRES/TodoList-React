import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas na Vercel.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { matricula, supervisor, equipe, projeto } = req.body;

    if (!matricula) {
      return res.status(400).json({ error: 'Matrícula do colaborador é obrigatória para atualização.' });
    }

    // Atualiza os campos correspondentes diretamente na tabela 'colaboradores'
    const { error } = await supabase
      .from('colaboradores')
      .update({
        supervisor: supervisor || null,
        equipe: equipe || null,
        projeto: projeto || null
      })
      .eq('matricula', matricula);

    if (error) throw error;

    return res.status(200).json({
      status: 'success',
      mensagem: 'Parâmetros fixados atualizados com sucesso no cadastro do colaborador!'
    });

  } catch (err) {
    console.error('Erro ao atualizar parâmetros do colaborador:', err.message);
    return res.status(500).json({ 
      status: 'error', 
      mensagem: 'Falha ao atualizar parâmetros no servidor',
      detalhe: err.message 
    });
  }
}
