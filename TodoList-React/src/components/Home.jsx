/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

//React Library
import { useEffect, useState } from "react";
//React Library

//Resources local
import DeleteClip from "../audio/delete.wav";
import ClickClip from "../audio/isDoneTask.ogg";
import Denied from "../audio/denied.wav";
import Popupstyle from "../css/popup.module.css";
import homestylesheet from "../css/home.module.css";
import popupstylesheet from "../css/popup.module.css";

import Tarefa from "../Classes/Tarefa";
import { Now, Tomorrow, DateComparison, IsConclued, IsExpired, DateToZeroHours, IsPendent } from "../Classes/DateOperations";
//Resources local

//Library AOS Scrool animated
import Aos from "aos";

//Library AOS Srool animated

//Components
import Header from "./Header";
import ContainerList from "./ContainerList";
import NavBar from "./NavBar";
import Footer from "./Footer";
import Layout from "./Layout";
import Popup from "./Popup";
//Components

function Home(){

    const [itensFiltred,setItensFiltred] = useState([]);
    const [methodFilter,setMethodFilter] = useState({"Filter": (x)=> {return x}});

    const [dateOptions,setDates] = useState([Now(),Tomorrow()]);
    const [itens,setItens] = useState([]);
    const [openPopup,setOpenPopup] = useState(new Tarefa(-1,false,"Elemento Default",Tarefa.GetDateObject(Now()),Tarefa.GetDateObject(Now()),Tarefa.GetDateObject(Now()),Tarefa.GetDateObject(Now()),Tarefa.GetDateObject(Now()),0));

    function AddNewItem(){
        if(DateComparison(dateOptions[0],dateOptions[1]) == 1)
        {
            PlayAudio(Denied);
            return alert(`A data inicial ${ Tarefa.GetDateObject(dateOptions[0]).ToStringShort() }, não pode ser maior que a data final ${ Tarefa.GetDateObject(dateOptions[1]).ToStringShort() }!`);
        }

        let element = document.getElementById("input");
        if((element.value != "") && (element != null) &&(element != undefined)){
            PlayAudio(ClickClip);
            let array = itens.map((x)=> x);
            let getId = GetNewIdUnReverd();
            array.push(
            {
                "key":getId,
                "id":getId,
                "tarefa":element.value,
                "state":"unDone",
                "date": Tarefa.GetDateObject(Now()),
                "modificacao":Tarefa.GetDateObject(Now()),
                "expiracao":Tarefa.GetDateObject(dateOptions[1]),
                "validade": Tarefa.GetDateObject(dateOptions[0]),
                "conclusao":Tarefa.GetDateObject(new Date(1800,11,31,0,0,0,0)),
                "qtdeModificacao": 0
            });
            element.value = "";
            element.focus();
            setItens(array);
        }else{
            PlayAudio(Denied);
            element.value ="";
        }
    }

    function GetNewIdUnReverd(){
        if(itens == undefined || itens.length == 0){
            return 0;
        }
        let ids = itens.map((x)=> x.id);
        let i = 0;
        while(ids.find((x)=> x == i) != undefined){
            i++;
        }
        return i;
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
        }
        setItens(lista);
        SetLocalStorage('itens',lista);
    }

    const OnUseEffectUpdate = (id, state)=>
    {   
        let arraycp = itens.map((e)=>e);
        let elem = GetElement(id,itens);

        if(state)
        {
            elem.conclusao = Tarefa.GetDateObject(Now());
            arraycp.splice(arraycp.indexOf(elem),1);
            arraycp.push(elem);
            SetLocalStorage('itens',arraycp);
            OnLoadLocalStorage('itens');            
            setItensFiltred(methodFilter.Filter(arraycp));
        }else{
            elem.conclusao = Tarefa.GetDateObject(new Date(1800, 11, 31, 0, 0, 0, 0));
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
    }

    function OnLoadLocalStorage(key){
        let itensSaved =  GetSavedLocalStorage(key);

        if((itensSaved != null) && (itensSaved != undefined) && (itensSaved.length != 0))
        {
            setItens(itensSaved);
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
                try{
                    let attr = document.getElementById(newarray[i].id).getAttribute("class");
                    newarray[i].state = attr.split(' ').filter(x=>x == "Done" || x=="unDone")[0];
                }catch{
                    let attr = itens.filter((e)=> e.id == newarray[i].id)[0].state;
                    newarray[i].state = attr;
                }                
            }
            localStorage.setItem(key,JSON.stringify(newarray));
        }
        else if(itensSaved == null)
        {
            for(let i = 0; i < unsaved.length; i++){
                let attr = document.getElementById(unsaved[i].id).getAttribute("class");
                unsaved[i].state = attr.split(' ').filter(x=>x == "Done" || x=="unDone")[0];
            }
            localStorage.setItem(key, JSON.stringify(unsaved));
        } else {
            localStorage.setItem(key,JSON.stringify(itens));
        }
    }

    function SetItemForIndexInArray(index,item,list){
        let newlist = [];
        for(let i=0; i < list.length; i++){
            newlist[i] = (i != index)? list[i] : item;
        }
        return newlist;
    }

    function OnClosePopup(){
        let popup = document.getElementById("Popup");
        popup.classList.remove(Popupstyle.parent_pop_up);
        popup.classList.add(Popupstyle.parent_pop_up_event);
        setOpenPopup(new Tarefa(-1, false, "Default", Tarefa.GetDateObject(Now()), Tarefa.GetDateObject(Now()),Tarefa.GetDateObject(Now()),Tarefa.GetDateObject(Now()),Tarefa.GetDateObject(Now()),0));        
    }

    const OnOpenPopUpEdit = (objectOld) =>{
        if(objectOld != undefined && objectOld != null){
            setOpenPopup(objectOld);
            let popup = document.getElementById("Popup");
            popup.classList.remove(Popupstyle.parent_pop_up_event);
            popup.classList.add(Popupstyle.parent_pop_up);
        }
    };

    const OnEditItemForText = (id, newText)=>{
        let item  = GetElement(id,itens);
        if(item != undefined){
            item.tarefa = newText;
            item.modificacao = Tarefa.GetDateObject(Now());
            item.qtdeModificacao++;
            SetLocalStorage('itens',SetItemForIndexInArray(itens.indexOf(item),item,itens));
            OnLoadLocalStorage('itens');
            setItensFiltred(methodFilter.Filter(itens));
        }
    };

    useEffect(()=>
    {
        Aos.init();
        if(itens == null || itens == undefined || itens.length == 0)
        {
            OnLoadLocalStorage('itens');
        }

        let getItens = GetSavedLocalStorage('itens');
        if((getItens !== undefined && getItens != null && getItens.length < itens.length) || itens.length == 0)
        {
            SetLocalStorage('itens',itens);
        }

        if(itensFiltred.length != methodFilter.Filter(itens).length){
            setItensFiltred(methodFilter.Filter(itens));
        }

        return ()=>{
        }        
    });

    function CallbackFilter(func){
        setMethodFilter({"Filter":func});
        try
        {
            setItensFiltred(func(itens));
        }catch(error){
            console.log(error);
        }
    }

    const updateFunc = (id)=> {
        return itens.find((x)=> x.id == id);
    };

    const optionsObject = [
        { 
            "Title" : "Detalhes", 
            "Content": 
            <p className={ popupstylesheet.pop_up_p }>
                {"Criado em : " + Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Data)).ToString()}<br/>
                {"Para: " + Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Validade)).ToStringShort()}<br/>
                {"Expira em: " + Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Expiracao)).ToStringShort()}<br/>
                {
                    (openPopup.QtdeModificacao > 0? "Ultima modificação em: " + Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Modificacao)).ToString() : "OBS: Sem modificações.")
                }<br/>
                {
                    openPopup.QtdeModificacao > 0 && "Qtde: " + openPopup.QtdeModificacao
                }<br/>
                {/* {
                    IsPendent(Tarefa.GetDefaultDate(openPopup.Conclusao),Tarefa.GetDefaultDate(openPopup.Expiracao),Tarefa.GetDefaultDate(openPopup.Validade))? 
                    "Status: Pendente" : ("Status: " (IsConclued() &&)? "" :"")
                }<br/> */}
                {
                    IsConclued(Tarefa.GetDefaultDate(openPopup.Conclusao)) && "Concluído em: " + Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Conclusao)).ToString()
                }<br/>
                {
                    IsExpired(Tarefa.GetDefaultDate(openPopup.Conclusao),Tarefa.GetDefaultDate(openPopup.Expiracao)) && "Expirada em: " + Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Expiracao)).ToStringShort()
                }<br/>
                {
                    (IsExpired(Tarefa.GetDefaultDate(openPopup.Conclusao),Tarefa.GetDefaultDate(openPopup.Expiracao)) && !IsConclued(Tarefa.GetDefaultDate(openPopup.Conclusao))) && "Tarefa não concluída no prazo."
                }
            </p>
        }
    ];

    const elementPopup = <Popup key={5} Item={openPopup} options={optionsObject} onclosepopup={ OnClosePopup } onedititemwithpopup={OnEditItemForText}/>;

    const elementosPage =
    [
        <NavBar key={0} contact={"(21) 96544-2847"} callbackfilter={CallbackFilter}/>,
        <Header key={1} title={"ToDo List"} addnewitem={AddNewItem} setdateshome={(forDate, expiredDate)=> {setDates([forDate,expiredDate]);}}/>,
        <ContainerList key={2} itens={itensFiltred}  onremoveitem={OnRemoveItem} onuseeffectupdate={OnUseEffectUpdate} ondeleteall={OnDeleteAll} onopenpopupedit={OnOpenPopUpEdit} updatehome={updateFunc}/>,
        <Footer key={3}/>,
        <div key={4} className={Popupstyle.parent_pop_up_event } id="Popup">
        {
            openPopup.Status && elementPopup
        }
        </div>
    ];

    return (
        <div className={homestylesheet.root}>
            <Layout elements={ elementosPage }/>
        </div>
    )
}

export default Home