import Profile from "./Profile";

export const requestlist = {
    GetProfilesList: async () => {
        try {
            // Chamada direta para a Serverless Function na Vercel (Supabase)
            const response = await fetch('https://tarkhiz-studios-site.vercel.app/api/leaderboard');

            if (!response.ok) {
                throw new Error(`Erro ao buscar leaderboard (${response.status})`);
            }

            const data = await response.json();
            return parseRankingData(data);

        } catch (error) {
            console.error("Erro ao obter o ranking do Supabase:", error);
            throw error;
        }
    }
};

// Padronização e formatação dos dados retornados pela API
function parseRankingData(data) {
    const rawList = data.ListResult || [];

    return {
        date: data.Date || null,
        profiles: rawList.map(p => ({
            nickname: p.Nickname || "",
            score: Number(p.Score || 0),
            position: p.Position ?? 0,
            icon: p.IconBase64 || "",
            description: p.Description || ""
        }))
    };
}




