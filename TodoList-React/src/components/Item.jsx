/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import stylesheet from "../css/home.module.css";
import { useEffect, useState } from "react";
import Tarefa from "../Classes/Tarefa";
import isDone from "../audio/isDoneTask.ogg";
import Denied from "../audio/denied.wav";

import Aos from "aos";
import CheckOut from "../img/check-out.png";
import CheckIn from "../img/check-in.png";
import Options from "../img/options.png";
import Clock from "../img/svg/clock.svg";

import { IsExpired, IsConclued, IsPendent } from "../Classes/DateOperations";

function Item({Item, onremoved, onuseeffectupdateitem, onopenpopupedit, updatehome}){

    const itemProperties = {
        "src": [CheckIn,CheckOut,Clock],
        "style": 
        {
            "textDecoration":["line-through","none","underline overline #FF3028"],
            "opacity":[0.5,1]
        }
    };

    const [item,setItem] = useState(DefineObjectSetItem(Item.id,Item.state == "Done",Item.tarefa,Item.date,Item.modificacao,Item.validade,Item.expiracao,Item.conclusao,Item.qtdeModificacao));

    function OnClickItemNew() {
        if((IsExpired(Tarefa.GetDefaultDate(Item.conclusao),Tarefa.GetDefaultDate(Item.expiracao))) || (!IsConclued(Tarefa.GetDefaultDate(Item.conclusao)) && IsExpired(Tarefa.GetDefaultDate(Item.conclusao),Tarefa.GetDefaultDate(Item.expiracao))) || (IsConclued(Tarefa.GetDefaultDate(Item.conclusao)) && IsExpired(Tarefa.GetDefaultDate(Item.conclusao),Tarefa.GetDefaultDate(Item.expiracao)))){
            PlayAudio(Denied);
            return;
        }
        PlayAudio(isDone);
        setItem(DefineObjectSetItem(Item.id,!item.status,Item.tarefa,Item.date,Item.modificacao,Item.validade,Item.expiracao,Item.conclusao,Item.qtdeModificacao));
        let doc = document.getElementById(Item.id);;
        if(item.status) {
            doc.classList.remove("Done");
            doc.classList.add("unDone");
        }else{
            doc.classList.remove("unDone");
            doc.classList.add("Done");
        }
        onuseeffectupdateitem(Item.id,!item.status);
    }

    function DefineObjectSetItem(idItem, status, tarefa, date, mod, valid, expir, concl, qtdeMod){
        let expired = IsExpired(Tarefa.GetDefaultDate(concl),Tarefa.GetDefaultDate(expir));
        let concluid = IsConclued(Tarefa.GetDefaultDate(concl));
        return {
            "id":idItem,
            "status":status,
            "tarefa":tarefa,
            "estilo":
            {
                "textDecoration":itemProperties.style.textDecoration[status && !expired ? 0 : (expired && !concluid? 2 : 1)],
                "opacity":itemProperties.style.opacity[status || expired ? 0 : 1], 
                textOverflow:"ellipsis", 
                whiteSpace:"nowrap", 
                overflow:"hidden"
            },
            "src": itemProperties.src[status && !expired? 0 : (expired? 2: 1)],
            "data": date,
            "modificacao": mod,
            "validade": valid,
            "expiracao": expir,
            "conclusao": concl,
            "qtdeModificacao": qtdeMod
        };
    }

    function PlayAudio(clip){
        let audioClick = new Audio(clip);
        audioClick.pause();
        audioClick.currentTime = 0;
        audioClick.volume = 0.10;
        audioClick.play();
    }

    useEffect(()=>
    {
        Aos.init();
        if(item.id == Item.id && item.tarefa != Item.tarefa){
            setItem(DefineObjectSetItem(Item.id,item.status,Item.tarefa,Item.date,Item.modificacao,Item.validade,Item.expiracao,Item.conclusao,Item.qtdeModificacao));
        }
    });

    function GetTitle(item){
        if(IsExpired(Tarefa.GetDefaultDate(item.conclusao),Tarefa.GetDefaultDate(item.expiracao))){
            return "Expirado.";
        }
        let concluido = IsConclued(Tarefa.GetDefaultDate(item.conclusao));
        return concluido ? "Concluído." : (IsPendent(Tarefa.GetDefaultDate(item.conclusao),Tarefa.GetDefaultDate(item.expiracao),Tarefa.GetDefaultDate(item.validade)))? "Pendente." : "Não concluído.";
    }

    return (
    <div data-aos="fade-right" key={item.id} id={item.id} className={stylesheet.item + (item.status ?" Done":" unDone")}>
        <div className={stylesheet.container_touch} onClick={OnClickItemNew}>
            <img src={ item.src} type="image/png" title={GetTitle(item)} />
            <h2 style={ item.estilo} title={item.tarefa} >{item.tarefa}</h2>
        </div>
        <img className={stylesheet.item_options} onClick={ () => onopenpopupedit(new Tarefa(item.id,true,item.tarefa,item.data,item.modificacao,item.validade,item.expiracao,updatehome(item.id).conclusao,item.qtdeModificacao))} src={Options}/>
        <button className={stylesheet.btn_delete} onClick={()=> onremoved(item.id)}>Deletar</button>
    </div>)
}

export default Item