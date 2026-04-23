class Profile {
    constructor(key,id,nickname,state,modo,score) {
        this.key =key;    
        this.id = id;
        this.nickname = nickname;
        this.state = state;
        this.modo = modo;
        this.score = score;
    }

    ToString(){
        return "Key: " + this.key + " | id: "+ this.id + " | Nickname: " + this.nickname + " | State: " + this.state + " | Modo: " + this.modo + " | Score: " + this.score;
    }
}

export default Profile