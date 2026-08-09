import React, { useEffect, useState } from 'react';
import { requestlist } from '../Classes/RequestDB';

const Leaderboard = () => {
    const [profiles, setProfiles] = useState([]);
    const [lastUpdate, setLastUpdate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(false);
                
                const result = await requestlist.GetProfilesList();
                
                setProfiles(result.profiles || []);
                if (result.date) {
                    setLastUpdate(result.date);
                }
            } catch (err) {
                console.error("Falha ao carregar ranking:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div style={{ color: '#ffffff', textAlign: 'center', marginTop: '40px', fontFamily: 'sans-serif' }}>
                <p>Carregando ranking...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ color: '#ff6b6b', textAlign: 'center', marginTop: '40px', fontFamily: 'sans-serif' }}>
                <p>Erro ao carregar o ranking global. Tente novamente mais tarde.</p>
            </div>
        );
    }

    return (
        <div 
            className="leaderboard-container" 
            style={{ 
                maxWidth: '450px', 
                margin: '0 auto', 
                padding: '20px', 
                fontFamily: 'sans-serif' 
            }}
        >
            <h2 style={{ color: '#ffffff', textAlign: 'center', marginBottom: '5px' }}>
                Ranking Global
            </h2>
            
            {lastUpdate && (
                <span style={{ color: '#8a8d93', fontSize: '12px', display: 'block', textAlign: 'center', marginBottom: '20px' }}>
                    Atualizado em: {new Date(lastUpdate).toLocaleString('pt-BR')}
                </span>
            )}

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {profiles.map((profile, index) => {
                    // Resolução do Avatar apontando para a pasta /public/avatares/
                    let avatarSrc = '/avatares/Avatar-0.png';

                    if (profile.icon && profile.icon.trim() !== "") {
                        if (profile.icon.startsWith("data:image") || profile.icon.length > 200) {
                            // Compatibilidade com cadastros antigos em Base64
                            avatarSrc = profile.icon.startsWith("data:image") ? profile.icon : `data:image/png;base64,${profile.icon}`;
                        } else {
                            // Mapeamento para imagens em /public/avatares/
                            const fileName = profile.icon.endsWith('.png') ? profile.icon : `${profile.icon}.png`;
                            avatarSrc = `/avatares/${fileName}`;
                        }
                    }

                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;

                    const posColor = isTop1 ? '#ffd700' : isTop2 ? '#c0c0c0' : isTop3 ? '#cd7f32' : '#8a8d93';

                    return (
                        <li 
                            key={profile.position ?? index} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                marginBottom: '8px',
                                padding: '10px 14px',
                                backgroundColor: isTop1 ? '#1e293b' : '#0f172a',
                                border: isTop1 ? '1px solid #eab308' : '1px solid #1e293b',
                                borderRadius: '8px'
                            }}
                        >
                            <span style={{ color: posColor, fontWeight: 'bold', width: '32px', textAlign: 'left', fontSize: '15px' }}>
                                {profile.position + 1}º
                            </span>

                            <img 
                                src={avatarSrc} 
                                alt={profile.nickname}
                                onError={(e) => {
                                    // Fallback caso a imagem especificada não seja encontrada
                                    e.target.src = '/avatares/Avatar-0.png';
                                }}
                                style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%', 
                                    marginRight: '12px', 
                                    objectFit: 'cover',
                                    border: `2px solid ${posColor}`
                                }} 
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1 }}>
                                <strong style={{ color: '#ffffff', fontSize: '14px' }}>
                                    {profile.nickname}
                                </strong>
                                {profile.description && (
                                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                                        {profile.description}
                                    </span>
                                )}
                            </div>

                            <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '15px' }}>
                                {Number(profile.score).toLocaleString('pt-BR')} <span style={{ fontSize: '11px', color: '#64748b' }}>pts</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default Leaderboard;