/* eslint-disable react/prop-types */

import stylesheet from "../../css/popup.module.css";
import { LuFileEdit } from "react-icons/lu";

import { DateComparison } from "../../Classes/DateOperations";
import Tarefa from "../../Classes/Tarefa";

function PopupFooter({Edit, OnEdit, Item, tarefaCurrent, itemwithpopup, onclosepopup, setEdit}){

    function verificationConcluido(){
       return (Item.Conclusao != undefined && DateComparison(Tarefa.GetDefaultDate(Item.Conclusao),new Date(1800,11,31,0,0,0,0)) != 0);
    }

    return (Edit ?
                <div className={stylesheet.pop_up_bottom}>
                    <hr style={{marginLeft:"30px", marginRight: "30px", marginTop:"10px"}}/>
                    <input id="input_edit_tarefa" className={stylesheet.pop_up_input} type="text" placeholder={"Digite a nova descrição"} onChange={(e)=> OnEdit(e.target.value)}/>
                    <button className={stylesheet.pop_up_button} onClick={()=> { itemwithpopup(Item.Id, tarefaCurrent); onclosepopup(false)}}>Confirmar</button>
                </div>
                :
                <div className={stylesheet.pop_up_bottom}>
                    <hr style={{marginLeft:"30px", marginRight: "30px", marginTop:"10px"}}/>
                    <div data-aos="fade-up" className={stylesheet.pop_up_container_edit}>
                        <div className={stylesheet.pop_up_container_dates}>             
                            <p className={stylesheet.pop_up_date} title=
                            {
                                Item.Data.Data 
                                + "/" + Item.Data.Mes[0] 
                                + "/" + Item.Data.Ano 
                                + " - " + Item.Data.Dia + "-feira"
                            }>
                            Criado em: { Tarefa.GetNumberHorsCorrecty(Item.Data.Data)}/{Tarefa.GetNumberHorsCorrecty(Item.Data.Mes[0])}/{Item.Data.Ano} {Item.Data.Dia.substring(0,3) + "."} {Tarefa.GetNumberHorsCorrecty(Item.Data.Horas)}:{Tarefa.GetNumberHorsCorrecty(Item.Data.Minutos)}:{Tarefa.GetNumberHorsCorrecty(Item.Data.Segundos)}</p>
                            {
                                !Item.EqualsDate(Item.Modificacao) && 
                                (
                                    <p className={stylesheet.pop_up_date_modification} title=
                                    {
                                        Tarefa.GetNumberHorsCorrecty(Item.Modificacao.Data)
                                        + "/" + Tarefa.GetNumberHorsCorrecty(Item.Modificacao.Mes[0])
                                        + "/" + Item.Modificacao.Ano 
                                        + " - " + Item.Modificacao.Dia + "-feira"
                                    }>
                                    Modificado em: {Tarefa.GetNumberHorsCorrecty(Item.Modificacao.Data)}/{Tarefa.GetNumberHorsCorrecty(Item.Modificacao.Mes[0])}/{Item.Modificacao.Ano} {Item.Modificacao.Dia.substring(0,3) + "."} {Tarefa.GetNumberHorsCorrecty(Item.Modificacao.Horas)}:{Tarefa.GetNumberHorsCorrecty(Item.Modificacao.Minutos)}:{Tarefa.GetNumberHorsCorrecty(Item.Modificacao.Segundos)} | Qtde. Mod.: {Tarefa.GetNumberHorsCorrecty(Item.QtdeModificacao)}</p>
                                )
                            }
                        </div>
                        <div className={stylesheet.pop_up_container_edit_div}>
                        {
                            !verificationConcluido() && <LuFileEdit className={stylesheet.pop_up_editBtn} onClick={()=> setEdit(true)}/>
                        }                                
                        </div>
                    </div>
                </div>

    );
}

export default PopupFooter