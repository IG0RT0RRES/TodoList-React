/* eslint-disable no-unused-vars */
import { useState } from "react";
import stylesheet from "../css/home.module.css";
// import { MdBrightness1 } from "react-icons/md";
// import { MdCast } from "react-icons/md";
import TodoListPng from "../img/TodoList-0.png";
import TodoListIco from "../img/lista-de-controle.png";

import Item from "./Item"
import NavBar from "./NavBar";
import Footer from "./Footer";

function Home(){
    const [countItens,setCountItens] = useState(0);
    const [itens,setItens] = useState([]);

    function AddTarefa (){
        let element = document.getElementById("input");
        OnCountReset(); 
        if((element.value !== "") && (element !== null) &&(element !== undefined))
        {
            let array = itens.map((x)=> x);
            array.push(<Item key={countItens} id={countItens} tarefa={element.value} isDone={false} onremoved={ ()=>RemoveTarefa(countItens)}/>);
            element.value = "";
            element.focus();
            setItens(array);
            setCountItens(countItens + 1);
        }else{
            element.value = "";
        }
    }

    function OnCountReset(){    
        if(itens.length <= 0){
            setCountItens(0);
        }   
    }

    function RemoveTarefa(id){    
        RemoveTarefaLocal(id);
    }

    function RemoveTarefaLocal(id){
        let array = itens.map((x)=> x);
        array.splice(id,1);
        setItens(array);
        OnCountReset();
    }

    return (
    <div>
        <div className={stylesheet.container}>
            <NavBar/>
            <h1>ToDo List</h1>
            <input id="input" className={stylesheet.input} type="text" placeholder="Digite a tarefa..."  onKeyDown={(e)=>{e.keyCode =="13" && AddTarefa()}}/>
            <button className={stylesheet.btn_add} onClick={AddTarefa}>Adicionar</button>
            <div id="container-tarefa" className={stylesheet.container_tarefa}>
            {
                itens.map((e)=> e)
            }
            {
                itens.length == 0 &&
                (
                    <div id="container-ilustration" className={stylesheet.container_ilustration}>
                        <img className={stylesheet.ilustration} src={TodoListPng} type="img/png" alt="ilustration"/>
                    </div>
                )
            }
            <img style={{color:"white", width:60, height:60, textAlign:"center"} } src={TodoListIco}/>
            </div>
            {/* <input id="input-2" className={stylesheet.input} type="text" placeholder="Digite o index da tarefa..."/>
            <button className={stylesheet.btn_add} onClick={()=> RemoveTarefaLocal(document.getElementById("input-2").value)}>Reload</button> */}
        </div>
        <Footer/>
    </div>)
}

export default Home