/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import stylesheet from "../css/home.module.css";
import { useEffect, useState } from "react";
import Ogg from "../audio/isDoneTask.ogg";
import Aos from "aos";
import "aos/dist/aos.css";
import CheckOut from "../img/check-out.png";
import CheckIn from "../img/check-in.png";
import Options from "../img/options.png";

function Item({id,tarefa,isDone, onremoved, onuseeffectupdateitem,onopenpopupedit}){

    const itemProperties = {
        "src": [CheckIn,CheckOut],
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
    });

    return (
    <div data-aos="fade-right" key={id} id={id} className={stylesheet.item + (item.state ?" Done":" unDone")}>
        <div className={stylesheet.container_touch} onClick={OnClickItemNew}>
            <img src={ item.src} type="image/png"/>
            <h2 style={ item.style}>{tarefa}</h2>
        </div>
        <img className={stylesheet.item_options} onClick={ () => onopenpopupedit({ "state" :true, "target": {"id": item.id, "tarefa": tarefa}})} src={Options}/>
        <button className={stylesheet.btn_delete} onClick={()=> onremoved(id)}>Deletar</button>
    </div>)
}

export default Item