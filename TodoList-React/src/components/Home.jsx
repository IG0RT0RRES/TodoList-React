import { useState } from "react";
import stylesheet from "../css/estilo.module.css";

import Item from "./Item"

function Home(){
    const [countItens,setCountItens] = useState(0);
    const [itens,setItens] = useState([]);

    function AddTarefa (){
        let element = document.getElementById("input");

        if(itens.length <= 0){
            setCountItens(0);
        }   
        if((element.value !== "") && (element !== null) &&(element !== undefined))
        {
            let array = itens.map((x)=> x);
            array.push(<Item key={countItens} id={countItens} tarefa={element.value} isDone={false}/>);
            element.value = "";
            element.focus();
            setItens(array);
            setCountItens(countItens + 1);
        }else{
            element.value = "";
        }
    }
    return (
    <div className={stylesheet.container}>
        <h1>ToDo List</h1>
        <input id="input" className={stylesheet.input} type="text" placeholder="Digite a tarefa..."/>
        <button className={stylesheet.btn_add} onClick={AddTarefa}>Adicionar</button>
        <div className={stylesheet.container_tarefa}>
        {
            itens.map((e)=> e)
        }
        </div>
    </div>)
}

export default Home