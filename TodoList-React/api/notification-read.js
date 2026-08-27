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
    const chaveLimpa = chave ? chave.trim() : '';

    if (!id_notificacao || !chaveLimpa) {
      return res.status(400).json({ error: 'ID da notificação e Chave são obrigatórios.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase não configurado no servidor.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Registra o histórico individual na tabela 'notificacoes_lidas'
    // O 'upsert' evita erro de duplicidade caso o usuário clique mais de uma vez
    const { error: errLidas } = await supabase
      .from('notificacoes_lidas')
      .upsert(
        { notificacao_id: id_notificacao, chave_usuario: chaveLimpa },
        { onConflict: 'notificacao_id,chave_usuario' }
      );

    if (errLidas) throw errLidas;

    // 3. Se for uma notificação individual (chave_alvo NÃO é nula), desativa na tabela principal
    const { data: desativadas, error: errUpdate } = await supabase
      .from('notificacoes')
      .update({ ativa: false })
      .eq('id', id_notificacao)
      .not('chave_alvo', 'is', null)
      .select();

    if (errUpdate) throw errUpdate;

    return res.status(200).json({ 
      sucesso: true, 
      registrado_como_lido: true,
      desativada_no_banco: desativadas && desativadas.length > 0 
    });

  } catch (error) {
    console.error('❌ Erro ao processar leitura da notificação:', error);
    return res.status(500).json({ error: error.message });
  }
}
