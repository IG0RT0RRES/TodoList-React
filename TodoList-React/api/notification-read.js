import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-app-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. Validar Token de Segurança
  const appToken = req.headers['x-app-token'];
  const tokenSecretoServidor = process.env.APP_SECRET_TOKEN;

  if (!appToken || appToken !== tokenSecretoServidor) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const { id_notificacao, chave } = req.body || {};

    if (!id_notificacao) {
      return res.status(400).json({ error: 'ID da notificação não informado.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Desativa no Supabase SOMENTE SE a notificação for direcionada a uma chave específica (não global)
    const { data, error } = await supabase
      .from('notificacoes')
      .update({ ativa: false })
      .eq('id', id_notificacao)
      .not('chave_alvo', 'is', null) // Garante que nunca desativará avisos globais
      .select();

    if (error) throw error;

    return res.status(200).json({ 
      sucesso: true, 
      desativada_no_banco: data && data.length > 0 
    });

  } catch (error) {
    console.error('❌ Erro ao desativar notificação:', error);
    return res.status(500).json({ error: error.message });
  }
}
