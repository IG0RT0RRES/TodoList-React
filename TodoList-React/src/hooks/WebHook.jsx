import React, { useEffect } from 'react';

// Use desestruturação padrão do JS (sem o $)
const WebHook = ({ title, description, Info, color, properties }) => {
    
    useEffect(() => {
        const sendWebHook = async () => {
            const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL; // Pegando a URL do Webhook do arquivo .env

            const payload = {
                username: 'Page Quiz Bot TodoList', // Optional: Custom username for the bot
                avatar_url: 'https://cdn.discordapp.com/attachments/1441061340197158944/1492579365970514116/TodoList-0.png?ex=69dbd85b&is=69da86db&hm=cdc4cdf5674c2f63138e14a418680b3b4535cd85a4a7955d7286f3566bb0957a&', // Optional: Custom avatar for the bot
                content: 'Callback from Page Quiz Privacy Policy',
                embeds: [{
                    title: title,       
                    description: description + "\r\n" + Info,
                    color: parseInt(color) || 0,
                    fields: [
                        { 
                            name: properties?.[0] || 'Campo', 
                            value: properties?.[1] || 'Valor', 
                            inline: properties?.[2] || false 
                        },
                        { name: 'Time', value: new Date().toLocaleString(), inline: false }
                    ]
                }]
            };

            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                console.log("Webhook enviado com sucesso!");
            } catch (error) {
                console.error("Erro ao enviar Webhook:", error);
            }
        };

        sendWebHook();
    }, []); // O array vazio [] garante que só envie UMA vez ao carregar

    return null; // O componente não precisa renderizar nada visualmente
};

export default WebHook;