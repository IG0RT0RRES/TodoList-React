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

    // Busca as tabelas individualmente
    const { data: supervisoresData, error: errSup } = await supabase.from('supervisores').select('nome');
    if (errSup) throw new Error(`Erro em supervisores: ${errSup.message}`);

    const { data: equipesData, error: errEq } = await supabase.from('equipes').select('nome');
    if (errEq) throw new Error(`Erro em equipes: ${errEq.message}`);

    const { data: projetosData, error: errProj } = await supabase.from('projetos').select('nome');
    if (errProj) throw new Error(`Erro em projetos: ${errProj.message}`);

    const { data: colaboradoresData, error: errColab } = await supabase.from('colaboradores').select('matricula, nome');
    if (errColab) throw new Error(`Erro em colaboradores: ${errColab.message}`);

    // Opcional: Você pode buscar a versão mínima de uma tabela de configurações do Supabase se preferir gerenciar via banco.
    // Exemplo: const { data: configApp } = await supabase.from('configuracoes_app').select('*').single();
    // Caso contrário, definimos os valores padrão de controle aqui:
    const versao_minima = "1.0.0"; // Altere para "1.2.0" quando quiser obrigar os usuários a atualizarem
    const url_loja = "https://github.com/IG0RT0RRES"; // Link direto para baixar a nova versão ou GitHub/Release

    // Mapeia os dados para o formato original
    const supervisores = (supervisoresData || []).map(item => item.nome);
    const equipes = (equipesData || []).map(item => item.nome);
    const projetos = (projetosData || []).map(item => item.nome);

    const colaboradores = (colaboradoresData || []).map(item => {
      const nomeUpper = item.nome ? item.nome.toUpperCase() : '';
      return item.matricula ? `${item.matricula} - ${nomeUpper}` : nomeUpper;
    });

    return res.status(200).json({
      supervisores,
      colaboradores,
      equipes,
      projetos,
      versao_minima,
      url_loja
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
