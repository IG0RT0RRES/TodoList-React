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

    // --- LÓGICA DE EXCLUSÃO DE NOTAS ANTIGAS (> 4 dias) COM COLUNA DATE ---
    try {
      const [diaPart, mesPart, anoPart] = diaLimpo.split('/');
      const dataReferenciaObj = new Date(`${anoPart}-${mesPart}-${diaPart}`);

      if (!isNaN(dataReferenciaObj.getTime())) {
        const dataLimite = new Date(dataReferenciaObj);
        dataLimite.setDate(dataLimite.getDate() - 4);

        // Formata a data limite para o padrão ISO (YYYY-MM-DD) que o tipo DATE do Postgres exige
        const anoL = dataLimite.getFullYear();
        const mesL = String(dataLimite.getMonth() + 1).padStart(2, '0');
        const diaL = String(dataLimite.getDate()).padStart(2, '0');
        const dataLimiteStr = `${anoL}-${mesL}-${diaL}`;

        // Exclusão nativa e eficiente direto no banco de dados
        await supabase
          .from('notas_servico')
          .delete()
          .eq('usuario', usuarioLimpo)
          .lt('data_referencia', dataLimiteStr);
      }
    } catch (cleanError) {
      console.error('⚠️ Aviso ao tentar limpar notas antigas:', cleanError);
    }
    // --------------------------------------------------------------------

    // Formata a data de busca para o padrão ISO (YYYY-MM-DD) para consultar a coluna DATE corretamente
    const [diaB, mesB, anoB] = diaLimpo.split('/');
    const diaIso = `${anoB}-${mesB}-${diaB}`;

    // Consulta as notas no Supabase filtrando pelo usuário e data no formato date
    const { data, error } = await supabase
      .from('notas_servico')
      .select('*')
      .eq('usuario', usuarioLimpo)
      .eq('data_referencia', diaIso)
      .order('criado_em', { ascending: false });

    if (error) throw error;

    // Remove os zeros à esquerda do numero_os e ponto_instalacao de cada nota retornada
    const notasFormatadas = (data || []).map(nota => ({
      ...nota,
      // Se ao salvar no banco você estiver gravando a data como YYYY-MM-DD e quiser exibi-la de volta como DD/MM/YYYY para o Flet:
      data_referencia: nota.data_referencia ? nota.data_referencia.split('-').reverse().join('/') : nota.data_referencia,
      numero_os: nota.numero_os ? String(nota.numero_os).replace(/^0+/, '') : nota.numero_os,
      ponto_instalacao: nota.ponto_instalacao ? String(nota.ponto_instalacao).replace(/^0+/, '') : nota.ponto_instalacao
    }));

    // Retorna a lista tratada de notas para o aplicativo Flet
    return res.status(200).json({
      sucesso: true,
      total: notasFormatadas.length,
      notas: notasFormatadas
    });

  } catch (error) {
    console.error('❌ Erro ao buscar notas do dia:', error);
    return res.status(500).json({ error: error.message });
  }
}
