/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import stylesheet from "../css/home.module.css";
import { useEffect, useState } from "react";
import Ogg from "../audio/isDoneTask.ogg";
import Aos from "aos";
import "aos/dist/aos.css";

function Item({id,tarefa,isDone, onremoved, onuseeffectupdateitem}){

    const itemProperties = {
        "src":["https://cdn.discordapp.com/attachments/741731794772295805/1293328013550944268/check-in.png?ex=6706f913&is=6705a793&hm=2db601a36db622723327c375829a43450987f053cd956812c3eb8a531b1341c4&","https://cdn.discordapp.com/attachments/741731794772295805/1293328013320261714/check-out.png?ex=6706f913&is=6705a793&hm=f4fb8a2761c7a67cfcef2695fe0025328c97c719c1d046f257e19d8c7f1ebe88&"],
        "style": {"textDecoration":["line-through","none"],"opacity":[0.5,1]},
        "state": false,
        "animation" : "flip-up"
    };

    const [item,setItem] = useState({
        "id":id,
        "state":isDone,
        "style":{"textDecoration":itemProperties.style.textDecoration[isDone? 0 : 1],"opacity":itemProperties.style.opacity[isDone? 0 : 1], textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden"},
        "src": itemProperties.src[isDone? 0 : 1]
    });

    function OnClickItemNew(){
        PlayAudio(Ogg);
        setItem({"id":id,"state":!item.state,"style":{"textDecoration":itemProperties.style.textDecoration[!item.state? 0 : 1],"opacity":itemProperties.style.opacity[!item.state? 0 : 1], textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden"},"src": itemProperties.src[!item.state? 0 : 1]});        
        let doc = document.getElementById(id);;
        if(item.state) {
            doc.classList.remove("Done");
            doc.classList.add("unDone");
        }else{
            doc.classList.remove("unDone");
            doc.classList.add("Done");
        }
        onuseeffectupdateitem(item.id,!item.state);
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
    })

    return (
    <div data-aos="fade-right" key={id} id={id} className={stylesheet.item + (item.state ?" Done":" unDone")}>
        <div className={stylesheet.container_touch} onClick={OnClickItemNew}>
            <img src={ item.src}/>
            <h2 style={ item.style}>{tarefa}</h2>
        </div>
        <button className={stylesheet.btn_delete} onClick={()=> onremoved(id)}>Deletar</button>
    </div>)
}

export default Item