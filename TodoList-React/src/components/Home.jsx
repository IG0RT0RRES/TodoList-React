/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import stylesheet from "../css/home.module.css";
import TodoListPng from "../img/TodoList-0.png";
import TodoListIco from "../img/lista-de-controle.png";
import DeleteClip from "../audio/delete.wav";
import ClickClip from "../audio/isDoneTask.ogg";

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
            PlayAudio(ClickClip);
            let array = itens.map((x)=> x);
            array.push({"key":countItens,"id":countItens,"tarefa":element.value,"state":"unDone"});
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
    
    function PlayAudio(clip){
        let audioClick = new Audio(clip);
        audioClick.pause();
        audioClick.currentTime = 0;
        audioClick.volume = 0.10;
        audioClick.src = clip;
        audioClick.play();
    }

    const OnRemoveItem = (id)=>{    
        PlayAudio(DeleteClip);
        let lista = itens.filter(x=> x.id != id);
        if(itens.length == 1)
        {
            localStorage.clear();
            setCountItens(0);
        }
        setItens(lista);
        SetLocalStorage('itens',lista);
    }

    const OnUseEffectUpdate = (id,state)=>
    {
        if(state)
        {
            let arraycp = itens.map((e)=>e);
            let elem = GetElement(id,itens);
            arraycp.splice(arraycp.indexOf(elem),1);
            arraycp.push(elem);
            SetLocalStorage('itens',arraycp);
            OnLoadLocalStorage('itens');
        }else{
            SetLocalStorage('itens',itens);
        }
    }

    function GetElement(id,array)
    {   
        let arraycp = array.map(x=>x);
        let element = arraycp.filter(function(elem) 
        {
            return elem.id == id;
        });
        if(element !== undefined && element !== null && element.length !== 0){
            return element[0];
        }
        return undefined;
    }

    function OnDeleteAll(){
        PlayAudio(DeleteClip);
        localStorage.clear();
        setItens([]);
        setCountItens(0);
    }

    function OnLoadLocalStorage(key){
        let itensSaved =  GetSavedLocalStorage(key);
        if((itensSaved !== null) && (itensSaved !== undefined) && (itensSaved.length !== 0))
        {
            setItens(itensSaved);
            setCountItens(itensSaved.length);
        }
    }

    function GetSavedLocalStorage(key){
        return JSON.parse(localStorage.getItem(key));
    }

    function SetLocalStorage(key, unsaved){
        let itensSaved =  GetSavedLocalStorage(key);
        if((itensSaved !== null) && (itensSaved !== undefined) && (unsaved.length !== 0) || (itensSaved !== null) && (itensSaved !== undefined) && itensSaved.length > 0 && unsaved.length == 0)
        {
            let array = unsaved.map((x)=> x);
            let newarray = array.filter(function(elem, pos, self) {
                return self.indexOf(elem) == pos;
            })
            for(let i = 0; i < newarray.length; i++){
                let attr = document.getElementById(newarray[i].id).getAttribute("class");
                newarray[i].state = attr.split(' ')[1];
            }
            localStorage.setItem(key,JSON.stringify(newarray));
        }
        else if(itensSaved == null)
        {
            for(let i = 0; i < unsaved.length; i++){
                let attr = document.getElementById(unsaved[i].id).getAttribute("class");
                unsaved[i].state = attr.split(' ')[1];
            }
            localStorage.setItem(key, JSON.stringify(unsaved));
        } else {
            localStorage.setItem(key,JSON.stringify(itens));
        }
}

    useEffect(()=>
    {
        if(itens == null || itens == undefined || itens.length == 0)
        {
            OnLoadLocalStorage('itens');
        }

        let getItens = GetSavedLocalStorage('itens');
        if((getItens !== undefined && getItens != null && getItens.length < itens.length) || itens.length == 0)
        {
            SetLocalStorage('itens',itens);
        }
    });

    return (
    <>
        <nav className={stylesheet.nav_bar}>
            <NavBar/>
        </nav>
        <header className={stylesheet.container}>    
            <h1 data-aos="fade-left">ToDo List</h1>
            <input id="input" className={stylesheet.input} type="text" placeholder="Digite a tarefa..."  onKeyDown={(e)=>{e.keyCode =="13" && AddNewItem()}}/>
            <button className={stylesheet.btn_add} onClick={AddNewItem}>Adicionar</button>
        </header>
        <section className={stylesheet.container}>
            <div id="container-tarefa" className={stylesheet.container_tarefa}>
            <ListItens itens={itens} onremoveitem={OnRemoveItem} onuseeffectupdate={OnUseEffectUpdate}/>
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
                        <button data-aos="zoom-in-up" className={stylesheet.btn_deleteall} onClick={OnDeleteAll} >Deletar tudo</button>
                    </div>
                )
            }
            <img data-aos="zoom-in-up" style={{color:"white", width:60, height:60, textAlign:"center"} } src={TodoListIco}/>
            </div>
        </section>
        <footer>
            <Footer/>
        </footer>
    </>)
}

export default Home