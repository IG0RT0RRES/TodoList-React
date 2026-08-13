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
    const { chave, device_id } = req.body;

    if (!chave) {
      return res.status(400).json({ autorizado: false, motivo: 'Chave não informada.' });
    }

    if (!device_id) {
      return res.status(400).json({ autorizado: false, motivo: 'Identificador do dispositivo não informado.' });
    }

    const chaveFormatada = chave.trim().toUpperCase();

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ autorizado: false, motivo: 'Configuração do Supabase ausente no servidor.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar a licença no Supabase junto com os dados do colaborador
    const { data: licenca, error: fetchError } = await supabase
      .from('licencas')
      .select(`
        *,
        colaboradores (
          nome,
          matricula
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

    // 2. CASO: Chave EXPIRADA ou INATIVA
    if (agora > dataValidade || licenca.status !== 'ativa') {
      if (licenca.status !== 'expirada') {
        await supabase
          .from('licencas')
          .update({ status: 'expirada' })
          .eq('chave', chaveFormatada);
      }

      return res.status(403).json({
        autorizado: false,
        status: 'expirada',
        motivo: `Sua licença expirou em ${dataValidadeFormatada}. Adquira um novo acesso.`,
      });
    }

    // 3. Mecânica Anti-Compartilhamento (Vínculo de Device ID)
    if (!licenca.device_id) {
      await supabase
        .from('licencas')
        .update({ device_id: device_id })
        .eq('chave', chaveFormatada);
    } else if (licenca.device_id !== device_id) {
      return res.status(403).json({
        autorizado: false,
        motivo: 'Esta licença já está vinculada a outro usuário. O compartilhamento não é permitido.',
      });
    }

    // 4. Mapeia corretamente a flag de administrador vinda da coluna 'admin'
    const isAdmin = Boolean(licenca.admin);
    const tipoUsuarioStr = isAdmin ? '👑 (Administrador)' : '👤 (Usuário)';
    const nomeColab = licenca.colaboradores?.nome ? licenca.colaboradores.nome : 'Cliente';
    const nomeUsuarioStr = `\n- Nome: ${nomeColab}`;

    await dispararWebhook(`🔑 **Acesso ao App Realizado** ${tipoUsuarioStr}\n- Licença: \`${chaveFormatada}\`${nomeUsuarioStr}\n- Validade: ${dataValidadeFormatada}`);

    return res.status(200).json({
      autorizado: true,
      status: 'ativa',
      admin: isAdmin, // Garante o envio explícito para o app Flet
      usuario: nomeColab,
      validade: dataValidadeFormatada,
      mensagem: 'Acesso autorizado.',
    });

  } catch (error) {
    console.error('Erro ao validar chave:', error);
    return res.status(500).json({ autorizado: false, motivo: 'Erro interno no servidor de validação.' });
  }
}
