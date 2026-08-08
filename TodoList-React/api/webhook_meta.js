export default async function handler(req, res) {
  // Token secreto configurado no painel da Meta
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN_WEBHOOK_META;
  
  // URL do Webhook do Discord (recomenda-se colocar nas variáveis de ambiente da Vercel como process.env.DISCORD_WEBHOOK_URL)
  const VITE_DISCORD_WEBHOOK_URL = process.env.VITE_DISCORD_WEBHOOK_URL;

  // ==========================================
  // MÉTODO GET: Verificação do Webhook pela Meta
  // ==========================================
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verificado com sucesso!");
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send("Token de verificação inválido");
      }
    }
    return res.status(400).send("Parâmetros ausentes");
  }

  // ==========================================
  // MÉTODO POST: Recebimento de Eventos / Mensagens
  // ==========================================
  if (req.method === "POST") {
    const body = req.body;

    // Verifica se o objeto recebido corresponde ao esperado da WABA[cite: 1]
    if (body && body.object === "whatsapp_business_account") {
      try {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            const value = change.value || {};
            const field = change.field;

            // Processa o campo 'messages' informado pela documentação da Meta[cite: 1]
            if (field === "messages" && value.messages) {
              // Extrai informações de contato se disponíveis
              const contacts = value.contacts || [];
              const nomeRemetente = contacts.length > 0 && contacts[0].profile ? contacts[0].profile.name : "Desconhecido";

              for (const message of value.messages) {
                const remetente = message.from;
                const msgId = message.id;
                const timestamp = message.timestamp;
                const textoMsg = message.text ? message.text.body : "[Mídia ou outro tipo de mensagem]";

                console.log(`Mensagem recebida de ${remetente} (ID: ${msgId}): ${textoMsg}`);

                // Formata e envia a mensagem para o Discord
                await enviarParaDiscord(VITE_DISCORD_WEBHOOK_URL, {
                  nome: nomeRemetente,
                  telefone: remetente,
                  texto: textoMsg,
                  id: msgId,
                  timestamp: timestamp
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("Erro ao processar a carga do webhook:", e);
        return res.status(500).json({ status: "erro", detalhes: e.message });
      }

      // Retorna 200 OK rapidamente para a Meta não reenviar o webhook por falha[cite: 1]
      return res.status(200).json({ status: "recebido" });
    }

    return res.status(404).json({ status: "ignorado" });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Método ${req.method} não permitido`);
}

// Função auxiliar para enviar a carga formatada ao Discord
async function enviarParaDiscord(webhookUrl, dados) {
  if (!webhookUrl || webhookUrl.includes("SUA_URL_DO_WEBHOOK")) {
    console.log("URL do Webhook do Discord não configurada.");
    return;
  }

  // Monta uma mensagem estruturada e elegante (Embed do Discord)
  const payload = {
    username: "Notificador WhatsApp",
    avatar_url: "https://i.imgur.com/Tg00qH0.png",
    embeds: [
      {
        title: "📥 Nova Mensagem Recebida",
        color: 3066993, // Cor verde corporativa
        fields: [
          { name: "👤 Nome", value: dados.nome, inline: true },
          { name: "📱 Telefone / WhatsApp", value: `+${dados.telefone}`, inline: true },
          { name: "💬 Mensagem", value: dados.texto, inline: false }
        ],
        footer: {
          text: `ID: ${dados.id}`
        },
        timestamp: new Date(Number(dados.timestamp) * 1000).toISOString()
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`Erro ao enviar para o Discord: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Erro de conexão ao enviar para o Discord:", error);
  }
}