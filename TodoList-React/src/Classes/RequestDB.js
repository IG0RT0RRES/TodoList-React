import Profile from "./Profile";
import CryptoJS from 'crypto-js';

export const request = {
    url: "http://tarkhizstudio.hopto.org:48/{id}",
    GetProfile: async (id) => {
        try {
            const response = await fetch(request.url.replace("{id}", id));
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            const data = await response.json();
            return new Profile(data.key, data.id, data.nickname, data.state, data.modo, data.score);
        } catch (error) {
            console.error("Erro ao obter perfil:", error);
            throw error;
        }
    }
};

export const requestlist = {
    urlList: "https://tarkhizstudio.hopto.org:48/UnityBackend/apiquiz-restclient-dev.com.br/RankedProfilesGet.php",
    urlListDefault : "http://localhost:46/UnityBackend/apiquiz-restclient-dev.com.br/RankedProfilesGet.php",
    GetProfilesList: async () => {
        try {
            const urlToUse = import.meta.env.VITE_USE_LOCAL_API === 'true' ? requestlist.urlListDefault : requestlist.urlList;
            const response = await fetch(authTools.GetCredentialsInUrl(urlToUse, "leaderboard", false));            
            if (!response.ok) {
                throw new Error(`Erro ao buscar lista: ${response.status}`);
            }
            const data = await response.json();
            return data.Profiles.map(p => ({
                nickname: p.Nickname,
                score: p.Score,
                position: p.Position,
                icon: p.IconBase64,
                description: p.Description
            }));
            
        } catch (error) {
            console.error("Erro ao obter lista de perfis:", error);
            throw error;
        }
    }
};

export const authTools = {
    GetCredentialsInUrl: (url, username, isAdmin) => {
        const keyToUse = isAdmin ? import.meta.env.VITE_ADMIN_SECRET_KEY : import.meta.env.VITE_SECURITY_SECRET_KEY;    
        const reqTime = Math.floor(Date.now() / 1000);        
        const rawData = username + reqTime;    
        const expectedToken = CryptoJS.HmacSHA256(rawData, keyToUse).toString(CryptoJS.enc.Hex);        
        const result = `?auth_token=${expectedToken}&req_time=${reqTime}&UserName=${username}`;
        return url + result;
    }
};