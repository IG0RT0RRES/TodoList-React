export default async function handler(req, res) {
  // Configuração CORS para aceitar chamadas do seu app
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
    const { chave, nome, equipe, total_baixas, data_operacao } = req.body;

    if (!chave) {
      return res.status(400).json({ sucesso: false, motivo: 'Chave não informada.' });
    }

    const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(500).json({ sucesso: false, motivo: 'Webhook não configurado no servidor.' });
    }

    const chaveFormatada = chave.trim().toUpperCase();
    const nomeUsuario = nome || 'Não identificado';
    const equipeFormatada = equipe || 'Não informada';
    const totalBaixasFormatado = total_baixas !== undefined ? total_baixas : 0;
    
    // Data da operação formatada (caso não venha do app, pega a data atual do servidor)
    const dataOperacao = data_operacao || new Date().toLocaleDateString('pt-BR');

    // Montando o payload com Embed do Discord (igual ao modelo visual com tarja lateral)
    const payload = {
      content: "Novo relatório de processamento de baixas realizado!",
      embeds: [
        {
          title: "📊 Processamento de Baixas Concluído",
          description: "Um lote de baixas foi executado com sucesso pelo aplicativo.",
          color: 15158332, // Cor vermelha lateral (mesmo padrão da imagem)
          fields: [
            {
              name: "Licença / Chave",
              value: `\`${chaveFormatada}\``,
              inline: true
            },
            {
              name: "Total de Baixas",
              value: `\`${totalBaixasFormatado}\` itens`,
              inline: true
            },
            {
              name: "Colaborador",
              value: `${nomeUsuario}`,
              inline: false
            },
            {
              name: "Equipe",
              value: `${equipeFormatada}`,
              inline: true
            },
            {
              name: "Data da Operação",
              value: `${dataOperacao}`,
              inline: true
            }
          ],
          footer: {
            text: "Baixas Forms – Sistema de Automação"
          }
        }
      ]
    };

    // Disparando para o Webhook do Discord
    const responseWebhook = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!responseWebhook.ok) {
      throw new Error('Falha ao enviar notificação para o Discord.');
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Analytics enviado com sucesso para o Discord.',
    });

  } catch (error) {
    console.error('Erro ao processar analytics:', error);
    return res.status(500).json({ sucesso: false, motivo: 'Erro interno ao processar o analytics.' });
  }
}
