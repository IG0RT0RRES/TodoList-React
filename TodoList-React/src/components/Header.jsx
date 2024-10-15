/* eslint-disable react/prop-types */
import { useEffect } from "react";
import stylesheet from "../css/home.module.css";
import Aos from "aos";
import "aos/dist/aos.css";

function Header({title, addnewitem}){

    useEffect(()=>{
        Aos.init();
    });

    return (
        <header className={stylesheet.container}>    
            <h1 data-aos="fade-left">{title}</h1>
            <input id="input" className={stylesheet.input} type="text" placeholder="Digite a tarefa..."  onKeyDown={(e)=>{e.keyCode =="13" && addnewitem()}}/>
            <button className={stylesheet.btn_add} onClick={addnewitem}>Adicionar</button>
        </header>)
}

export default Header