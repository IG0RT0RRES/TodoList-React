import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-app-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { usuario, dia } = req.body || {};
    
    if (!usuario || !dia) {
      return res.status(400).json({ error: 'Parâmetros "usuario" e "dia" são obrigatórios.' });
    }

    const usuarioLimpo = usuario.trim();
    const diaLimpo = dia.trim();

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase não configurado no servidor.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Consulta as notas no Supabase filtrando estritamente pelo usuário e data de referência
    const { data, error } = await supabase
      .from('notas_servico')
      .select('*')
      .eq('usuario', usuarioLimpo)
      .eq('data_referencia', diaLimpo)
      .order('criado_em', { ascending: false });

    if (error) throw error;

    // Retorna a lista de notas para o aplicativo Flet
    return res.status(200).json({
      sucesso: true,
      total: data ? data.length : 0,
      notas: data || []
    });

  } catch (error) {
    console.error('❌ Erro ao buscar notas do dia:', error);
    return res.status(500).json({ error: error.message });
  }
}
