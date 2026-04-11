import React, { useEffect } from 'react';

// Use desestruturação padrão do JS (sem o $)
const WebHook = ({ title, description, color, properties }) => {
    
    useEffect(() => {
        const sendWebHook = async () => {
            const webhookUrl = 'https://discord.com/api/webhooks/1441113413878026301/dpuZeDbFuPXZeF5R2sjhB9sL-hsKSvwr6Dm5LdS1ZUauRhVRFE2l5v7aVbTrBFIeiHmY';

            const payload = {
                username: 'Dev [Squirrel-ADM]',
            avatar_url: 'https://cdn.discordapp.com/attachments/1441061340197158944/1441061400905781459/15036608_191927481265760_7120102291578567324_n.jpg?ex=69206c83&is=691f1b03&hm=df1da1877c787751163a74a21f3faac6a2fe11cbc088e31b69c365bc6ee8a00b&', // Optional: Custom avatar for the bot
                content: 'Callback from Page Quiz Privacy Policy',
                embeds: [{
                    title: title,
                    description: description,
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