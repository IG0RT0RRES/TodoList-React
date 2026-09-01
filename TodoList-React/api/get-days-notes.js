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

        // Formata a data limite para o padrão ISO (YYYY-MM-DD) para que o banco consiga comparar corretamente em formato textual
        const diaL = String(dataLimite.getDate()).padStart(2, '0');
        const mesL = String(dataLimite.getMonth() + 1).padStart(2, '0');
        const anoL = dataLimite.getFullYear();
        const dataLimiteStr = `${anoL}-${mesL}-${diaL}`;

        // Como o banco armazena em DD/MM/YYYY (texto), uma comparação estritamente alfanumérica falha.
        // A melhor abordagem prática mantendo o campo texto é converter a string do banco no formato YYYY-MM-DD via SQL (substring/concat) 
        // ou alterar o campo no Supabase para o tipo DATE. 
        // Abaixo ajustamos a query para comparar invertendo o formato DD/MM/YYYY para YYYY-MM-DD em tempo de execução no Postgres:
        await supabase
          .from('notas_servico')
          .delete()
          .eq('usuario', usuarioLimpo)
          .lt("concat(substring(data_referencia, 7, 4), '-', substring(data_referencia, 4, 2), '-', substring(data_referencia, 1, 2))", dataLimiteStr);
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
