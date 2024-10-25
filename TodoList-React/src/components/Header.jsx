/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect } from "react";
import stylesheet from "../css/home.module.css";
import Aos from "aos";
import DateManager from "./DateManager";

function Header({title, addnewitem,setdateshome}){

    useEffect(()=>{
        Aos.init();
    });

    return (
        <header className={stylesheet.container}>
            <h1 data-aos="fade-left">{title}</h1>
            <input id="input" className={stylesheet.input} type="text" placeholder="Digite a tarefa..."  onKeyDown={(e)=>{e.keyCode =="13" && addnewitem()}}/>
            <button className={stylesheet.btn_add} onClick={addnewitem}>Adicionar</button>
            <DateManager setdateshome={setdateshome}/>
        </header>)
}

export default Header