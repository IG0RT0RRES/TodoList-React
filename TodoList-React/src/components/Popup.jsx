/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import stylesheet from "../css/popup.module.css";
import Aos from "aos";
import "aos/dist/aos.css";
import { useEffect, useState } from "react";

function Popup({idItem,tarefaitem, onclosepopup, onedititemwithpopup}){

    const [tarefa] = useState(tarefaitem);
    const [tarefaCurrent,setTarefaCurrent] = useState(tarefaitem);

    useEffect(()=>{
        Aos.init();
        document.getElementById("input_edit_tarefa").focus();
    });

    function Edit(input){
        let text = input.target.value;
        setTarefaCurrent(text);
    }
    
    function OnKeyDown(key){
        if(key == "13"){
            let inputCurrent = document.getElementById("input_edit_tarefa");
            onclosepopup(false);
            if(inputCurrent.value != "" && inputCurrent.value.length > 0 && inputCurrent.value != undefined && inputCurrent.value != null){
                onedititemwithpopup(idItem,tarefaCurrent);
            }
        }
    }

    return (
        <div className={ stylesheet.pop_up } onKeyDown={(e)=> {OnKeyDown(e.keyCode)}}>
            <div className={stylesheet.container_pop_up_p}>               
                <p className={stylesheet.pop_up_p}>{tarefaCurrent}</p>
            </div>
            <input id="input_edit_tarefa" className={stylesheet.pop_up_input} type="text" placeholder={"Digite a nova descrição"} onChange={Edit}/>
            <div className={stylesheet.pop_up_container_button}>
                <button onClick={()=> {onclosepopup(false); onedititemwithpopup(idItem,tarefaCurrent);}}>Confirmar</button>
                <button onClick={()=>{onclosepopup(false)}}>Cancelar</button>
            </div>
        </div>
    )
}

export default Popup