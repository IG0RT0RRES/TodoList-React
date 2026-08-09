import Profile from "./Profile";
import CryptoJS from 'crypto-js';

export const requestlist = {
    urlList: "https://tarkhizstudio.hopto.org:48/UnityBackend/apiquiz-restclient-dev.com.br/RankedProfilesGet.php",
    urlListDefault: "http://localhost:46/UnityBackend/apiquiz-restclient-dev.com.br/RankedProfilesGet.php",
    
    GetProfilesList: async () => {
        try {
            // 1. TENTATIVA PRINCIPAL: Servidor PHP
            const urlToUse = import.meta.env.VITE_USE_LOCAL_API === 'true' 
                ? requestlist.urlListDefault 
                : requestlist.urlList;
                
            const fullUrl = authTools.GetCredentialsInUrl(urlToUse, "leaderboard", false);
            const response = await fetch(fullUrl);
            
            if (!response.ok) {
                throw new Error(`Servidor PHP respondeu com status: ${response.status}`);
            }
            
            const data = await response.json();
            return parseRankingData(data);

        } catch (primaryError) {
            console.warn("API principal PHP fora do ar. Recorrendo à Serverless Function /api/leaderboard...", primaryError);

            try {
                // 2. FALLBACK: Vercel Serverless Function + Google Drive
                const vercelResponse = await fetch('/api/leaderboard');

                if (!vercelResponse.ok) {
                    throw new Error(`API Vercel respondeu com status: ${vercelResponse.status}`);
                }

                const driveData = await vercelResponse.json();
                return parseRankingData(driveData);

            } catch (fallbackError) {
                console.error("Erro crítico em ambas as vias de obtenção do ranking.", fallbackError);
                throw fallbackError;
            }
        }
    }
};

// Função auxiliar para padronizar as respostas de ambas as fontes
function parseRankingData(data) {
    const rawList = data.ListResult || data.Profiles || [];
    
    return {
        date: data.Date || null,
        profiles: rawList.map(p => ({
            nickname: p.Nickname || p.nickname,
            score: Number(p.Score || p.score),
            position: p.Position ?? p.position,
            icon: p.IconBase64 || p.icon || "",
            description: p.Description || p.description || ""
        }))
    };
}

export const authTools = {
    GetCredentialsInUrl: (url, username, isAdmin) => {
        const keyToUse = isAdmin 
            ? import.meta.env.VITE_ADMIN_SECRET_KEY 
            : import.meta.env.VITE_SECURITY_SECRET_KEY;
            
        const reqTime = Math.floor(Date.now() / 1000);        
        const rawData = username + reqTime;    
        const expectedToken = CryptoJS.HmacSHA256(rawData, keyToUse || "").toString(CryptoJS.enc.Hex);        
        
        return `${url}?auth_token=${expectedToken}&req_time=${reqTime}&UserName=${encodeURIComponent(username)}`;
    }
};