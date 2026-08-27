import { createClient } from '@supabase/supabase-js';

// Função auxiliar para disparar o webhook de notificação (Discord)
async function dispararWebhook(conteudoMensagem) {
  const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: conteudoMensagem,
      }),
    });
  } catch (error) {
    console.error('Erro ao disparar webhook:', error);
  }
}

export default async function handler(req, res) {
  // Configuração CORS para aceitar chamadas do app
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { chave } = req.body;

    if (!chave) {
      return res.status(400).json({ autorizado: false, motivo: 'Chave não informada.' });
    }    
    
    const chaveFormatada = chave.trim().toUpperCase();
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ autorizado: false, motivo: 'Configuração do Supabase ausente no servidor.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar a licença no Supabase junto com os dados e preferências do colaborador
    const { data: licenca, error: fetchError } = await supabase
      .from('licencas')
      .select(`
        id,
        chave,
        status,
        data_validade,
        admin,
        tipo,
        colaboradores (
          id,
          nome,
          matricula,
          email,
          equipe,
          projeto,
          supervisor
        )
      `)
      .eq('chave', chaveFormatada)
      .single();

    if (fetchError || !licenca) {
      return res.status(401).json({
        autorizado: false,
        motivo: 'Chave de acesso inválida ou não encontrada.',
      });
    }

    const agora = new Date();
    const dataValidade = new Date(licenca.data_validade);
    const dataValidadeFormatada = dataValidade.toLocaleDateString('pt-BR');
    const estaExpirada = agora > dataValidade || licenca.status === 'expirada';

    // Se estiver expirada no banco, garante a atualização do status
    if (estaExpirada && licenca.status !== 'expirada') {
      await supabase
        .from('licencas')
        .update({ status: 'expirada' })
        .eq('chave', chaveFormatada);
    }

    // 2. Mapeia a flag de administrador e o tipo de licença
    const isAdmin = Boolean(licenca.admin);
    const tipoLicenca = licenca.tipo || 'mensal';
    const tipoUsuarioStr = isAdmin ? '👑 (Administrador)' : `👤 (Usuário - ${tipoLicenca.toUpperCase()})`;
    
    // Obtém os dados do colaborador
    const nomeColab = licenca.colaboradores?.nome ? licenca.colaboradores.nome : 'Cliente';
    const matriculaColab = licenca.colaboradores?.matricula ? licenca.colaboradores.matricula : '';
    const emailColab = licenca.colaboradores?.email ? licenca.colaboradores.email : '';
    
    const usuarioCompleto = matriculaColab ? `${matriculaColab} - ${nomeColab}` : nomeColab;
    const nomeUsuarioStr = `\n- Nome: ${nomeColab} (${matriculaColab})`;

    const colab = licenca.colaboradores || {};
    const preferenciasSalvas = {
      supervisor: colab.supervisor || "",
      colaborador: usuarioCompleto,
      equipe: colab.equipe || "",
      projeto: colab.projeto || ""
    };

    if (!isAdmin) {
      const statusWebhook = estaExpirada ? '⚠️ **Tentativa de Acesso (Licença Expirada)**' : '🔑 **Acesso ao App Realizado**';
      await dispararWebhook(`${statusWebhook} ${tipoUsuarioStr}\n- Licença: \`${chaveFormatada}\`${nomeUsuarioStr}\n- Validade: ${dataValidadeFormatada}`);
    }

    // 3. Retorna sucesso com o status correspondente (ativa ou expirada)
    // Passando data_expiracao no formato YYYY-MM-DD para o Python ler no 'verificar_licenca_ativa'
    return res.status(200).json({
      autorizado: true,
      status: estaExpirada ? 'expirada' : 'ativa',
      admin: isAdmin, 
      tipo: tipoLicenca,
      usuario: usuarioCompleto,
      nome_colaborador: nomeColab,
      matricula_colaborador: matriculaColab,
      email_colaborador: emailColab,
      validade: dataValidadeFormatada,
      data_expiracao: licenca.data_validade, // Enviado diretamente para a verificação do Flet
      preferencias: preferenciasSalvas,
      mensagem: estaExpirada ? 'Licença expirada. Acesso limitado.' : 'Acesso autorizado.',
    });

  } catch (error) {
    console.error('Erro ao validar chave:', error);
    return res.status(500).json({ autorizado: false, motivo: 'Erro interno no servidor de validação.' });
  }
}
