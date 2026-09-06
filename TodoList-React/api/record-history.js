import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-app-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const appToken = req.headers['x-app-token'];
  const tokenSecretoServidor = process.env.APP_SECRET_TOKEN;

  if (!appToken || appToken !== tokenSecretoServidor) {
    return res.status(403).json({ error: 'Acesso negado. Requisição não autorizada.' });
  }

  try {
    const { acao, payload } = req.body || {};

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase não configurado no servidor.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- ROTEAMENTO DAS AÇÕES ---

    // 1. Salvar Baixa (Sucesso) ou Erro
    if (acao === 'salvar_lote') {
      const { registros } = payload; // Array de objetos para inserção em lote
      if (!registros || !Array.isArray(registros)) {
        return res.status(400).json({ error: 'Payload de registros inválido.' });
      }

      const { error } = await supabase.from('historico_execucoes').insert(registros);
      if (error) throw error;

      return res.status(200).json({ sucesso: true, mensagem: 'Registros salvos com sucesso.' });
    }

    // 2. Buscar Notas Recentes (filtradas por usuário para evitar duplicidade nos últimos 3 dias)
    if (acao === 'obter_recentes') {
      const { usuario } = payload || {};
      if (!usuario) {
        return res.status(400).json({ error: 'Usuário não informado no payload.' });
      }

      const limiteData = new Date();
      limiteData.setDate(limiteData.getDate() - 3);
      const limiteDataStr = limiteData.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('historico_execucoes')
        .select('nota')
        .eq('usuario', usuario)
        .eq('tipo', 'sucesso')
        .gte('data_iso', limiteDataStr);

      if (error) throw error;

      const notasRecentes = (data || []).map(item => String(item.nota).trim());
      return res.status(200).json({ sucesso: true, notas: [...new Set(notasRecentes)] });
    }

    // 3. Carregar Histórico ou Erros formatados para a UI (filtrado por usuário)
    if (acao === 'carregar_dados') {
      const { tipo, usuario } = payload; // 'sucesso' ou 'erro', e a chave do usuário
      
      if (!usuario) {
        return res.status(400).json({ error: 'Usuário não informado no payload.' });
      }
      
      const { data, error } = await supabase
        .from('historico_execucoes')
        .select('*')
        .eq('usuario', usuario)
        .eq('tipo', tipo)
        .order('data_iso', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ sucesso: true, dados: data || [] });
    }

    // 4. Atualizar/Deletar Erros após Reenvio (Utilizando Usuário, Nota e Instalação para precisão)
    if (acao === 'atualizar_apos_reenvio') {
      const { dia_proc_iso, data_ref_iso, itens_sucesso, usuario } = payload;
      
      if (!usuario) {
        return res.status(400).json({ error: 'Usuário não informado no payload.' });
      }

      if (!itens_sucesso || itens_sucesso.length === 0) {
        return res.status(200).json({ sucesso: true });
      }

      // Deleta individualmente ou em lote os erros específicos do usuário que foram reenviados com sucesso
      for (const item of itens_sucesso) {
        const nota = String(item.nota || '').trim();
        const instalacao = String(item.instalacao || '').trim();

        let query = supabase
          .from('historico_execucoes')
          .delete()
          .eq('usuario', usuario)
          .eq('tipo', 'erro')
          .eq('data_iso', dia_proc_iso)
          .eq('data_referencia', data_ref_iso)
          .eq('nota', nota);

        if (instalacao) {
          query = query.eq('instalacao', instalacao);
        }

        const { error } = await query;
        if (error) throw error;
      }

      return res.status(200).json({ sucesso: true, mensagem: 'Erros limpos após reenvio.' });
    }

    return res.status(400).json({ error: 'Ação desconhecida.' });

  } catch (error) {
    console.error('❌ Erro na API de Histórico:', error);
    return res.status(500).json({ error: error.message });
  }
}
