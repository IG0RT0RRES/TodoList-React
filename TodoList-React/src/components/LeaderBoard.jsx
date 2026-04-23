import React, { useEffect, useState } from 'react';
import { requestlist } from '../Classes/RequestDB';

const Leaderboard = () => {
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const list = await requestlist.GetProfilesList();
                setProfiles(list);
            } catch (err) {
                console.error("Falha ao carregar ranking");
            }
        };
        loadData();
    }, []);

    return (
        <div className="leaderboard-container" style={{ maxWidth: '400px', margin: '0 auto', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ color: '#ffffff' }}>Ranking Global</h2>
            <ul>
                {profiles.map((profile, index) => (
                    <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ color: '#ffffff' }}>{profile.position + 1}º</span>
                        <img 
                            src={`data:image/png;base64,${profile.icon}`} 
                            alt={profile.nickname}
                            style={{ width: '40px', borderRadius: '50%', margin: '0 10px' }} 
                        />
                        <strong style={{color: '#ffffff' }}>{profile.nickname}</strong>
                        <span style={{ marginLeft: 'auto', color: '#ffffff' }}>{profile.score} pts</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Leaderboard;