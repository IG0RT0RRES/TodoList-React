import { createClient } from '@supabase/supabase-js';

// Inicializando o cliente do Supabase com as variáveis de ambiente da Vercel
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configuração CORS para aceitar chamadas do aplicativo
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ sucesso: false, motivo: 'Método não permitido' });
  }

  try {
    const { nota, comentario, chave, nome, equipe, versao_app } = req.body;

    // Validação básica
    if (!nota || typeof nota !== 'number' || nota < 1 || nota > 5) {
      return res.status(400).json({ 
        sucesso: false, 
        motivo: 'A nota é obrigatória e deve ser um valor entre 1 e 5.' 
      });
    }

    const notaUsuario = nota;
    const comentarioUsuario = comentario ? comentario.trim() : 'Nenhum comentário fornecido.';
    const chaveFormatada = chave ? chave.trim().toUpperCase() : 'NÃO INFORMADA';
    const nomeUsuario = nome || 'Não identificado';
    const equipeFormatada = equipe || 'Não informada';
    const versaoApp = versao_app || '1.0.0';
    const dataAvaliacao = new Date().toISOString();

    // 1. INSERINDO NO SUPABASE (Todas as avaliações vão para o banco)
    const { error: dbError } = await supabase
      .from('avaliacoes_app')
      .insert([
        {
          nota: notaUsuario,
          comentario: comentarioUsuario,
          chave: chaveFormatada,
          nome: nomeUsuario,
          equipe: equipeFormatada,
          versao_app: versaoApp,
          criado_em: dataAvaliacao
        }
      ]);

    if (dbError) {
      console.error('Erro ao salvar no Supabase:', dbError);
      return res.status(500).json({ sucesso: false, motivo: 'Erro ao salvar avaliação no banco de dados.' });
    }

    let discordEnviado = false;

    // 2. REGRA DO DISCORD: Se a nota for <= 3, dispara o alerta crítico no Discord
    if (notaUsuario <= 3) {
      const webhookUrl = process.env.VITE_DISCORD_WEBHOOK_URL;
      
      if (webhookUrl) {
        // Montando as estrelas visualmente para o embed
        const estrelasVisual = '⭐'.repeat(notaUsuario) + '☆'.repeat(5 - notaUsuario);

        const payloadDiscord = {
          content: "⚠️ **Alerta de Feedback Baixo!** Um usuário registrou uma avaliação insatisfatória.",
          embeds: [
            {
              title: "🚨 Nova Avaliação Negativa / Crítica",
              description: "Um colaborador avaliou o aplicativo com nota baixa. Verifique os detalhes abaixo:",
              color: 16711680, // Cor vermelha de destaque
              fields: [
                {
                  name: "Avaliação",
                  value: `${estrelasVisual} (**${notaUsuario}/5**)`,
                  inline: true
                },
                {
                  name: "Licença / Chave",
                  value: `\`${chaveFormatada}\``,
                  inline: true
                },
                {
                  name: "Comentário do Usuário",
                  value: `> ${comentarioUsuario}`,
                  inline: false
                },
                {
                  name: "Colaborador",
                  value: `${nomeUsuario}`,
                  inline: true
                },
                {
                  name: "Equipe",
                  value: `${equipeFormatada}`,
                  inline: true
                },
                {
                  name: "Versão do App",
                  value: `\`${versaoApp}\``,
                  inline: true
                }
              ],
              footer: {
                text: "Baixas Forms – Sistema de Monitoramento de Qualidade"
              },
              timestamp: dataAvaliacao
            }
          ]
        };

        const responseWebhook = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadDiscord),
        });

        if (responseWebhook.ok) {
          discordEnviado = true;
        } else {
          console.error('Falha ao enviar notificação de feedback para o Discord.');
        }
      }
    }

    // 3. REGRA DE REDIRECIONAMENTO PARA A LOJA
    // Notas 4 e 5 indicam que o usuário teve uma boa experiência -> redirecionar para a loja pública
    // Notas 1, 2 e 3 -> focar apenas no feedback interno
    const redirecionarLoja = notaUsuario >= 4;

    return res.status(200).json({
      sucesso: true,
      redirecionar_loja: redirecionarLoja,
      mensagem: redirecionarLoja 
        ? 'Obrigado pela avaliação! Redirecionando para a loja.' 
        : 'Feedback recebido com sucesso. Obrigado por nos ajudar a melhorar!',
      discord_alerta: discordEnviado
    });

  } catch (error) {
    console.error('Erro interno no servidor de avaliações:', error);
    return res.status(500).json({ sucesso: false, motivo: 'Erro interno ao processar a avaliação.' });
  }
}
