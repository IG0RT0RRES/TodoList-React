/* eslint-disable react/prop-types */

import { IoIosCloseCircleOutline } from "react-icons/io";
import stylesheet from "../../css/popup.module.css";
import { DateComparison } from "../../Classes/DateOperations";
import Tarefa from "../../Classes/Tarefa";
import { useState } from "react";

function PopupHeader({Item, onclosepopup}){

    const [item] = useState(Item);

    function verificationConcluido() {
       return (item.Conclusao != undefined && DateComparison(Tarefa.GetDefaultDate(item.Conclusao),new Date(1800,11,31,0,0,0,0)) != 0);
    }

    return (<div className={stylesheet.pop_up_header}>
        {
            verificationConcluido() &&
            <>
                <p className={stylesheet.pop_up_date_conclusao} title={
                    Tarefa.GetNumberHorsCorrecty(item.Conclusao.Data)
                    + "/" + Tarefa.GetNumberHorsCorrecty(item.Conclusao.Mes[0]) 
                    + "/" + item.Conclusao.Ano 
                    + " - " + item.Conclusao.Dia + "-feira"
                }>
                Concluído em: {Tarefa.GetNumberHorsCorrecty(item.Conclusao.Data)}/{Tarefa.GetNumberHorsCorrecty(item.Conclusao.Mes[0])}/{item.Conclusao.Ano} {item.Conclusao.Dia.substring(0,3) + "."} {Tarefa.GetNumberHorsCorrecty(item.Conclusao.Horas)}:{Tarefa.GetNumberHorsCorrecty(item.Conclusao.Minutos)}:{Tarefa.GetNumberHorsCorrecty(item.Conclusao.Segundos)}</p>
            </>
        }                
        <h2 data-aos="fade-right">Tarefa - Ler / Editar</h2>
        <IoIosCloseCircleOutline className={stylesheet.pop_up_header_closeEdit} onClick={()=>{onclosepopup(false)}}/>            
    </div>);
}

export default PopupHeader