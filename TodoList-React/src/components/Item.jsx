/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import stylesheet from "../css/home.module.css";
import { useEffect, useState } from "react";
import Tarefa from "../Classes/Tarefa";
import Ogg from "../audio/isDoneTask.ogg";
import Aos from "aos";
import CheckOut from "../img/check-out.png";
import CheckIn from "../img/check-in.png";
import Options from "../img/options.png";

function Item({Item,onremoved, onuseeffectupdateitem,onopenpopupedit}){

    const itemProperties = {
        "src": [CheckIn,CheckOut],
        "style": 
        {
            "textDecoration":["line-through","none"],
            "opacity":[0.5,1]
        }
    };

    const [item,setItem] = useState({
        "id":Item.id,
        "status":Item.state == "Done",
        "tarefa": Item.tarefa,
        "estilo":
        {
            "textDecoration":itemProperties.style.textDecoration[Item.state == "Done"? 0 : 1],
            "opacity":itemProperties.style.opacity[Item.state == "Done"? 0 : 1],
            textOverflow:"ellipsis", 
            whiteSpace:"nowrap",
            overflow:"hidden"
        },
        "src": itemProperties.src[Item.state == "Done"? 0 : 1],
        "data": Item.date,
        "modificacao":Item.modification
    });

    function OnClickItemNew(){
        PlayAudio(Ogg);
        setItem(
        {
            "id":Item.id,
            "status":!item.status,
            "tarefa":Item.tarefa,
            "estilo":
            {
                "textDecoration":itemProperties.style.textDecoration[!item.status? 0 : 1],
                "opacity":itemProperties.style.opacity[!item.status? 0 : 1], 
                textOverflow:"ellipsis", 
                whiteSpace:"nowrap", 
                overflow:"hidden"
            },
            "src": itemProperties.src[!item.status? 0 : 1],
            "data": Item.date,
            "modificacao": Item.modification
        });
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
            setItem(
            {
                "id":Item.id,
                "status":item.status,
                "tarefa":Item.tarefa,
                "estilo":
                {
                    "textDecoration":itemProperties.style.textDecoration[item.status? 0 : 1],
                    "opacity":itemProperties.style.opacity[item.status? 0 : 1], 
                    textOverflow:"ellipsis", 
                    whiteSpace:"nowrap", 
                    overflow:"hidden"
                },
                "src": itemProperties.src[item.status? 0 : 1],
                "data": Item.date,
                "modificacao":Item.modification
            });
        }
    });

    return (
    <div data-aos="fade-right" key={item.id} id={item.id} className={stylesheet.item + (item.status ?" Done":" unDone")}>
        <div className={stylesheet.container_touch} onClick={OnClickItemNew}>
            <img src={ item.src} type="image/png"/>
            <h2 style={ item.estilo} title={item.tarefa} >{item.tarefa}</h2>
        </div>
        <img className={stylesheet.item_options} onClick={ () => onopenpopupedit(new Tarefa(item.id,true,item.tarefa,item.data,item.modificacao))} src={Options}/>
        <button className={stylesheet.btn_delete} onClick={()=> onremoved(item.id)}>Deletar</button>
    </div>)
}

export default Item