/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import stylesheet from "../css/popup.module.css";
import Aos from "aos";
import "aos/dist/aos.css";
import { useEffect, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { LuFileEdit } from "react-icons/lu";

function Popup({idItem,tarefaitem, onclosepopup, onedititemwithpopup}){

    const [tarefa] = useState(tarefaitem);
    const [edit,setEdit] = useState(false);
    const [tarefaCurrent,setTarefaCurrent] = useState(tarefaitem);

    useEffect(()=>{
        Aos.init();        
        edit && document.getElementById("input_edit_tarefa").focus();
    });

    function Edit(input){
        let text = input.target.value;
        setTarefaCurrent(text);
    }
    
    function OnKeyDown(key){
        if(key == "13"){
            let inputCurrent = document.getElementById("input_edit_tarefa");
            if(inputCurrent.value != "" && inputCurrent.value.length > 0 && inputCurrent.value != undefined && inputCurrent.value != null){
                onedititemwithpopup(idItem,tarefaCurrent);
            }
            setTimeout(()=>{onclosepopup(false);},500);
        }

        if(key == "27" && edit){
            setTarefaCurrent(tarefa);
            setEdit(false);
        }
    }

    addEventListener("keydown",(key)=>OnKeyDown(key.keyCode));

    return (
        <div data-aos="fade-up" className={ stylesheet.pop_up } onKeyDown={(e)=> {OnKeyDown(e.keyCode)}}>
            <div className={stylesheet.pop_up_header}>
                <h2 data-aos="fade-right">Read or edit this task</h2>
                <IoIosCloseCircleOutline className={stylesheet.pop_up_header_closeEdit} onClick={()=>{onclosepopup(false)}}/>            
            </div>
            <div className={stylesheet.container_pop_up_p}>
                <p className={stylesheet.pop_up_p} title={tarefaCurrent}>{tarefaCurrent}</p>
            </div>
            {
                edit ?
                <>
                    <hr style={{marginLeft:"30px", marginRight: "30px", marginTop:"10px"}}/>
                    <input id="input_edit_tarefa" className={stylesheet.pop_up_input} type="text" placeholder={"Digite a nova descrição"} onChange={Edit}/>
                    <button className={stylesheet.pop_up_button} onClick={()=> { onedititemwithpopup(idItem,tarefaCurrent); onclosepopup(false); }}>Confirmar</button>
                </>
                :
                <div data-aos="fade-up" className={stylesheet.pop_up_container_edit}>
                    <LuFileEdit className={stylesheet.pop_up_editBtn} onClick={()=> setEdit(true)}/>
                </div>
            }
        </div>
    )
}

export default Popup