const getPFClient = () => {
  if (!window.PlayFab || !window.PlayFab.PlayFabClientApi) {
    throw new Error("PlayFab SDK não encontrado. Verifique se o script está no seu index.html");
  }  
  window.PlayFab.settings.titleId = "1F06E3";
  return window.PlayFab.PlayFabClientApi;
};

export const playfabService = {
  login: (email, password) => {
    return new Promise((resolve, reject) => {
      try {
        const client = getPFClient();
        const request = { 
          TitleId: window.PlayFab.settings.titleId,
          Email: email, 
          Password: password 
        };
        
        client.LoginWithEmailAddress(request, (error, result) => {
          if (result) resolve(result.data);
          else reject(error);
        });
      } catch (err) {
        reject(err);
      }
    });
  },

  // Função de registro atualizada e segura
  register: (username, displayname, email, password) => {
    return new Promise((resolve, reject) => {
      try {
        const client = getPFClient();
        const request = {
          TitleId: window.PlayFab.settings.titleId,
          Email: email,
          Password: password,
          Username: username,
          DisplayName: displayname,
          RequireBothUsernameAndEmail: true // Garante consistência no cadastro
        };

        client.RegisterPlayFabUser(request, (error, result) => {
          if (result) resolve(result.data);
          else reject(error);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
};