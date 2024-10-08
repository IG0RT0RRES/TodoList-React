/* eslint-disable no-unused-vars */
import { useState } from "react";
import stylesheet from "../css/home.module.css";
import TodoListPng from "../img/TodoList-0.png";
import TodoListIco from "../img/lista-de-controle.png";

import NavBar from "./NavBar";
import Footer from "./Footer";
import ListItens from "./ListItens";

function Home(){
    const [countItens,setCountItens] = useState(0);
    const [itens,setItens] = useState([]);

    function AddNewItem(){
        let element = document.getElementById("input");
        OnCountReset();
        if((element.value !== "") && (element !== null) &&(element !== undefined)){
            let array = itens.map((x)=> x);
            array.push({"key":countItens,"id":countItens,"tarefa":element.value});
            element.value = "";
            element.focus();
            setItens(array);
            setCountItens(countItens + 1);
        }else{
            element.value ="";
        }
    }

    function OnCountReset(){    
        if(itens.length <= 0){
            setCountItens(0);
        }   
    }

    const OnRemoveItem = (id)=>{    
        let lista = itens.filter(x=> x.id != id);
        setItens(lista);
    }

    function OnDeleteAll(){
        setItens([]);
    }

    return (
    <div>
        <div className={stylesheet.container}>
            <NavBar/>
            <h1>ToDo List</h1>
            <input id="input" className={stylesheet.input} type="text" placeholder="Digite a tarefa..."  onKeyDown={(e)=>{e.keyCode =="13" && AddNewItem()}}/>
            <button className={stylesheet.btn_add} onClick={AddNewItem}>Adicionar</button>
            <div id="container-tarefa" className={stylesheet.container_tarefa}>
            <ListItens itens={itens} onremoveitem={OnRemoveItem}/>
            {
                itens.length == 0 ?
                (
                    <div id="container-ilustration" className={stylesheet.container_ilustration}>
                        <img className={stylesheet.ilustration} src={TodoListPng} type="img/png" alt="ilustration"/>
                    </div>
                )
                :
                (
                    <div>
                        <hr className={stylesheet.hr}></hr>
                        <button className={stylesheet.btn_deleteall} onClick={OnDeleteAll} >Deletar tudo</button>
                    </div>
                )
            }
            <img style={{color:"white", width:60, height:60, textAlign:"center"} } src={TodoListIco}/>
            </div>
        </div>
        <Footer/>
    </div>)
}

export default Home