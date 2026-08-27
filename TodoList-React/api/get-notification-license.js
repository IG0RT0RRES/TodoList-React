import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-app-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  // 1. Validar a Chave Secreta enviada pelo App no Header
  const appToken = req.headers['x-app-token'];
  const tokenSecretoServidor = process.env.APP_SECRET_TOKEN;

  if (!appToken || appToken !== tokenSecretoServidor) {
    return res.status(403).json({ error: 'Acesso negado. Requisição não autorizada.' });
  }

  try {
    const { chave } = req.body || {};
    const chaveLimpa = chave ? chave.trim() : '';

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase não configurado no servidor.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Busca todas as notificações que ESTA CHAVE já leu na tabela auxiliar
    const { data: lidas, error: errLidas } = await supabase
      .from('notificacoes_lidas')
      .select('notificacao_id')
      .eq('chave_usuario', chaveLimpa);

    if (errLidas) {
      console.error('⚠️ Erro ao consultar histórico de leituras:', errLidas.message);
    }

    // Cria um array com os IDs das mensagens que já foram confirmadas
    const idsLidos = lidas ? lidas.map(item => item.notificacao_id) : [];

    // 3. Monta a query para buscar notificações ativas (globais OU específicas para esta chave)
    let query = supabase
      .from('notificacoes')
      .select('*')
      .eq('ativa', true)
      .or(`chave_alvo.is.null,chave_alvo.eq.${chaveLimpa}`)
      .order('created_at', { ascending: false });

    // 4. Se houver notificações já lidas por este usuário, ignora elas no resultado
    if (idsLidos.length > 0) {
      query = query.not('id', 'in', `(${idsLidos.join(',')})`);
    }

    const { data, error } = await query.limit(1);

    if (error) throw error;

    // 5. Retorna a notificação mais recente que o usuário ainda não confirmou leitura
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
