import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 1. Busca em paralelo todas as tabelas de parâmetros e colaboradores no Supabase
    const [
      { data: supervisoresData, error: errSup },
      { data: equipesData, error: errEq },
      { data: projetosData, error: errProj },
      { data: colaboradoresData, error: errColab }
    ] = await Promise.all([
      supabase.from('supervisores').select('nome'),
      supabase.from('equipes').select('nome'),
      supabase.from('projetos').select('nome'),
      supabase.from('colaboradores').select('matricula, nome')
    ]);

    if (errSup || errEq || errProj || errColab) {
      throw new Error('Erro ao buscar dados do Supabase');
    }

    // 2. Mapeia para arrays simples de strings (formato original esperado pelo app)
    const supervisores = supervisoresData.map(item => item.nome);
    const equipes = equipesData.map(item => item.nome);
    const projetos = projetosData.map(item => item.nome);

    // Formata a lista de colaboradores (ex: "7000027 - IGOR TORRES DE PADUA")
    const colaboradores = colaboradoresData.map(item => {
      const nomeUpper = item.nome ? item.nome.toUpperCase() : '';
      return item.matricula ? `${item.matricula} - ${nomeUpper}` : nomeUpper;
    });

    // 3. Retorna a estrutura JSON idêntica à original
    return res.status(200).json({
      supervisores,
      colaboradores,
      equipes,
      projetos
    });

  } catch (err) {
    console.error('Erro no endpoint parâmetros_bf:', err);
    return res.status(500).json({ status: 'error', detalhe: err.message });
  }
}
