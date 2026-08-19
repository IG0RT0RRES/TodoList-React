import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Permite apenas método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Valida se as credenciais existem explicitamente
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas na Vercel.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Busca as configurações globais do app (versão, manutenção, etc.)
    const { data: configApp, error: errConfig } = await supabase
      .from('configuracoes_app')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (errConfig) {
      console.warn(`Aviso ao buscar configuracoes_app: ${errConfig.message}`);
    }

    // Valores retornados do banco com fallback padrão caso a tabela esteja vazia
    const versao_minima = configApp?.versao_minima || "1.0.0";
    const url_loja = configApp?.url_loja || "https://play.google.com/store/apps/details?id=com.baixaforms.app";
    const modo_manutencao = configApp?.modo_manutencao ?? false;
    const mensagem_manutencao = configApp?.mensagem_manutencao || "Estamos realizando melhorias e atualizações no sistema. Por favor, tente novamente em alguns instantes.";

    // 2. Busca as tabelas de parâmetros
    const { data: supervisoresData, error: errSup } = await supabase.from('supervisores').select('nome');
    if (errSup) throw new Error(`Erro em supervisores: ${errSup.message}`);

    const { data: equipesData, error: errEq } = await supabase.from('equipes').select('nome');
    if (errEq) throw new Error(`Erro em equipes: ${errEq.message}`);

    const { data: projetosData, error: errProj } = await supabase.from('projetos').select('nome');
    if (errProj) throw new Error(`Erro em projetos: ${errProj.message}`);

    // 3. Busca apenas colaboradores com licença válida e ativa
    const dataAtual = new Date().toISOString();
    const { data: colaboradoresData, error: errColab } = await supabase
      .from('colaboradores')
      .select(`
        matricula, 
        nome,
        licencas!inner (
          data_validade,
          status
        )
      `)
      .gt('licencas.data_validade', dataAtual)
      .eq('licencas.status', 'ativo');

    if (errColab) throw new Error(`Erro em colaboradores: ${errColab.message}`);

    // Mapeia os dados para o formato original
    const supervisores = (supervisoresData || []).map(item => item.nome);
    const equipes = (equipesData || []).map(item => item.nome);
    const projetos = (projetosData || []).map(item => item.nome);

    const colaboradores = (colaboradoresData || []).map(item => {
      const nomeUpper = item.nome ? item.nome.toUpperCase() : '';
      return item.matricula ? `${item.matricula} - ${nomeUpper}` : nomeUpper;
    });

    // Retorna a resposta completa incluindo o modo de manutenção
    return res.status(200).json({
      supervisores,
      colaboradores,
      equipes,
      projetos,
      versao_minima,
      url_loja,
      modo_manutencao,
      mensagem_manutencao
    });

  } catch (err) {
    console.error('Detalhe do erro na Serverless Function:', err.message);
    return res.status(500).json({ 
      status: 'error', 
      mensagem: 'Falha ao processar requisição no servidor',
      detalhe: err.message 
    });
  }
}
