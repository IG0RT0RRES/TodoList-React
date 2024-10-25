/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import stylesheet from "../css/popup.module.css";
import Aos from "aos";
import { useEffect, useState } from "react";
import PopupHeader from "./Popup-SubComponents/PopupHeader";
import PopupSection from "./Popup-SubComponents/PopupSection";
import PopupFooter from "./Popup-SubComponents/PopupFooter";

function Popup({Item, options, onclosepopup, onedititemwithpopup}){

    const[item] = useState(Item);
    const [tarefa, setTarefa] = useState(Item.Tarefa);
    const [edit, setEdit] = useState(false);
    const [tarefaCurrent, setTarefaCurrent] = useState(Item.Tarefa);
    const [aba,setAba] = useState(0);
    
    const [contentOption,setcontenteOption] = useState(<p className={stylesheet.pop_up_p} title={tarefaCurrent}>{tarefaCurrent}</p>);
    const sectionBody =
    <div className={stylesheet.container_pop_up_p}>
        {contentOption}
    </div>

    useEffect(()=>{
        Aos.init();
        edit && document.getElementById("input_edit_tarefa").focus();
    });
    
    function OnKeyDown(key){
        if(key == "13" && edit){
            let inputCurrent = document.getElementById("input_edit_tarefa");
            if(inputCurrent.value != "" && inputCurrent.value.length > 0 && inputCurrent.value != undefined && inputCurrent.value != null){
                onedititemwithpopup(item.Id, tarefaCurrent);
            }
            setTarefa("Default");
            onclosepopup(false);
        }

        if(key == "27" && edit){
            setTarefaCurrent(tarefa);
            setEdit(false);
        }
    }

    function SetDefaultContent(){
        setcontenteOption(<p className={stylesheet.pop_up_p} title={tarefaCurrent}>{tarefaCurrent}</p>);
        setAba(0);
    }

    const optionsElement = 
    <div className={stylesheet.pop_up_navbar_container}>
        <ul>
            <li onClick={()=> 
            {
                SetDefaultContent(); 
            }}>Tarefa</li>
            {   options.map((el,i)=><li key={i} onClick=
                {
                    ()=>
                    {
                        setcontenteOption(el.Content);
                        setAba(i+1);
                    }
                }>{el.Title}</li>)
            }
        </ul>
    </div>;

    return (
        <div data-aos="fade-up" className={ stylesheet.pop_up } onKeyDown={(e)=> {OnKeyDown(e.keyCode)}}>
            <PopupHeader Item={item} onclosepopup={onclosepopup}/>
            { options != undefined && optionsElement }
            <PopupSection elemento={sectionBody}/>
            {
                aba == 0 && <PopupFooter Edit={edit} Item={item} tarefaCurrent={tarefaCurrent} OnEdit={setTarefaCurrent} onclosepopup={onclosepopup} itemwithpopup={onedititemwithpopup} setEdit={setEdit}/>
            }
        </div>
    )
}

export default Popup