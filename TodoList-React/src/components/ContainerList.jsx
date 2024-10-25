/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import ListItens from "./ListItens";
import TodoListPng from "../img/TodoList-0.png";
import TodoListIco from "../img/lista-de-controle.png";
import stylesheet from "../css/home.module.css";
import Aos from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

function ContainerList({itens,onremoveitem,onuseeffectupdate,ondeleteall,onopenpopupedit,updatehome}){

    useEffect(()=>{
        Aos.init();
    });

    return (
        <section className={stylesheet.container}>
            <div id="container-tarefa" className={stylesheet.container_tarefa}>
            <ListItens itens={itens} onremoveitem={onremoveitem} onuseeffectupdate={onuseeffectupdate} onopenpopup={onopenpopupedit} updatehome={updatehome}/>
            {
                itens.length == 0 ?
                (
                    <div id="container-ilustration" className={stylesheet.container_ilustration}>
                        <img data-aos="zoom-in-up" className={stylesheet.ilustration} src={TodoListPng} type="img/png" alt="ilustration"/>
                    </div>
                )
                :
                (
                    <div>
                        <hr data-aos="zoom-in-up" className={stylesheet.hr}></hr>
                        <button data-aos="zoom-in-up" className={stylesheet.btn_deleteall} onClick={ondeleteall} >Deletar tudo</button>
                    </div>
                )
            }
            <img data-aos="zoom-in-up" style={{color:"white", width:60, height:60, textAlign:"center"} } src={TodoListIco}/>
            </div>
        </section>)
}

export default ContainerList