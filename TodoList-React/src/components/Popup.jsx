/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import stylesheet from "../css/popup.module.css";
import Aos from "aos";
import { useEffect, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { LuFileEdit } from "react-icons/lu";

function Popup({Item, onclosepopup, onedititemwithpopup}){

    //const[item] = useState({"Id":Item.Id,"Tarefa":Item.Tarefa,"Data":Item.Data,"Modificacao":Item.Modificacao, "EqualsDate":Item.EqualsDate});
    const[item] = useState(Item);
    const [tarefa, setTarefa] = useState(Item.Tarefa);
    const [edit, setEdit] = useState(false);
    const [tarefaCurrent, setTarefaCurrent] = useState(Item.Tarefa);

    useEffect(()=>{
        Aos.init();
        edit && document.getElementById("input_edit_tarefa").focus();
    });

    function Edit(input){
        let text = input.target.value;
        setTarefaCurrent(text);
    }
    
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

    return (
        <div data-aos="fade-up" className={ stylesheet.pop_up } onKeyDown={(e)=> {OnKeyDown(e.keyCode)}}>
            <div className={stylesheet.pop_up_header}>
                <h2 data-aos="fade-right">Tarefa - Ler / Editar</h2>
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
                    <button className={stylesheet.pop_up_button} onClick={()=> { onedititemwithpopup(item.Id,tarefaCurrent); onclosepopup(false)}}>Confirmar</button>
                </>
                :
                <>
                    <hr style={{marginLeft:"30px", marginRight: "30px", marginTop:"10px"}}/>
                    <div data-aos="fade-up" className={stylesheet.pop_up_container_edit}>
                        <div className={stylesheet.pop_up_container_dates}>             
                            <p className={stylesheet.pop_up_date} title=
                            {
                                item.Data.Data 
                                + "/" + item.Data.Mes[0] 
                                + "/" + item.Data.Ano 
                                + " - " + item.Data.Dia + "-feira"
                            }>
                            Criado em: {item.Data.Data}/{item.Data.Mes[0]}/{item.Data.Ano} {item.Data.Dia.substring(0,3) + "."} {item.Data.Horas <= 9? "0" + item.Data.Horas : item.Data.Horas}:{item.Data.Minutos}:{item.Data.Segundos<=9? "0" + item.Data.Segundos : item.Data.Minutos}</p>
                            {
                                !item.EqualsDate(item.Modificacao) && 
                                (
                                    <p className={stylesheet.pop_up_date_modification} title=
                                    {
                                        item.Modificacao.Data 
                                        + "/" + item.Modificacao.Mes[0] 
                                        + "/" + item.Modificacao.Ano 
                                        + " - " + item.Modificacao.Dia + "-feira"
                                    }>
                                    Modificado em: {item.Modificacao.Data}/{item.Modificacao.Mes[0]}/{item.Modificacao.Ano} {item.Modificacao.Dia.substring(0,3) + "."} {item.Modificacao.Horas <= 9? "0" + item.Modificacao.Horas : item.Modificacao.Horas}:{item.Modificacao.Minutos <=9? "0" + item.Modificacao.Minutos:item.Modificacao.Minutos }:{item.Modificacao.Segundos<=9? "0" + item.Modificacao.Segundos : item.Modificacao.Segundos}</p>
                                )
                            }
                        </div>
                        <div className={stylesheet.pop_up_container_edit_div}>
                            <LuFileEdit className={stylesheet.pop_up_editBtn} onClick={()=> setEdit(true)}/>
                        </div>
                    </div>
                </>
            }
        </div>
    )
}

export default Popup