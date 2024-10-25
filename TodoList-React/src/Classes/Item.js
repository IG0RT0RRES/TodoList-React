import { Enum } from "./Enuns";

class Item {
    constructor(key,id,tarefa,state,firstdate,lastdate) {
        this.key =key;    
        this.id = id;
        this.tarefa = tarefa;
        this.state = state;
        this.date = firstdate;
        this.modification = lastdate;
    }

    static SetState(statesplit){
        let attr = statesplit.split(' ').filter(x=>x == "Done" || x=="unDone")[0];
        return (attr == "Done")? Enum.Done : Enum.unDone;
    }

    ToString(){
        return "Key: " + this.key + " | id: "+ this.id + " | Tarefa: " + this.tarefa + " | State: " + this.state + " | Date: " + this.date  + " | Modification: " + this.modification; 
    }
}

export default Item