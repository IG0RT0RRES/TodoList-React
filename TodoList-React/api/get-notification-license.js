import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { chave } = req.body || {};

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase não configurado no servidor.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Busca notificações ativas que sejam globais (chave_alvo IS NULL) OU destinadas a esta chave específica
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('ativa', true)
      .or(`chave_alvo.is.null,chave_alvo.eq.${chave ? chave.trim() : ''}`)
      .order('created_at', { ascending: false })
      .limit(1); // Pega a mais recente

    if (error) throw error;

    if (data && data.length > 0) {
      return res.status(200).json({
        tem_notificacao: true,
        notificacao: data[0]
      });
    }

    return res.status(200).json({ tem_notificacao: false });

  } catch (error) {
    console.error('❌ Erro ao buscar notificações:', error);
    return res.status(500).json({ error: error.message });
  }
}
