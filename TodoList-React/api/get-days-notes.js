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

    // --- LÓGICA DE EXCLUSÃO DE NOTAS ANTIGAS (> 4 dias) ---
    try {
      // Converte a data enviada (DD/MM/YYYY) para objeto Date
      const [diaPart, mesPart, anoPart] = diaLimpo.split('/');
      const dataReferenciaObj = new Date(`${anoPart}-${mesPart}-${diaPart}`);

      if (!isNaN(dataReferenciaObj.getTime())) {
        // Subtrai 4 dias da data solicitada como limite de corte
        const dataLimite = new Date(dataReferenciaObj);
        dataLimite.setDate(dataLimite.getDate() - 4);

        // Formata a data limite para DD/MM/YYYY para comparar com o formato salvo no banco
        const diaL = String(dataLimite.getDate()).padStart(2, '0');
        const mesL = String(dataLimite.getMonth() + 1).padStart(2, '0');
        const anoL = dataLimite.getFullYear();
        const dataLimiteStr = `${diaL}/${mesL}/${anoL}`;

        // Como o banco usa formato textual DD/MM/YYYY, fazemos a exclusão das datas estritamente anteriores ao limite
        // Nota: Para segurança e limpeza em lote, removemos do mesmo usuário tudo o que for menor que o limite de 4 dias.
        // Se a sua base tiver datas em formato ISO ou comparável por string, ajuste conforme necessário, 
        // mas aqui tratamos com o formato padrão salvo pela aplicação.
        await supabase
          .from('notas_servico')
          .delete()
          .eq('usuario', usuarioLimpo)
          .lt('data_referencia', dataLimiteStr);
      }
    } catch (cleanError) {
      console.error('⚠️ Aviso ao tentar limpar notas antigas:', cleanError);
      // Não interrompe o fluxo principal se a limpeza falhar
    }
    // ------------------------------------------------------

    // Consulta as notas no Supabase filtrando estritamente pelo usuário e data de referência
    const { data, error } = await supabase
      .from('notas_servico')
      .select('*')
      .eq('usuario', usuarioLimpo)
      .eq('data_referencia', diaLimpo)
      .order('criado_em', { ascending: false });

    if (error) throw error;

    // Remove os zeros à esquerda do numero_os e ponto_instalacao de cada nota retornada
    const notasFormatadas = (data || []).map(nota => ({
      ...nota,
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
