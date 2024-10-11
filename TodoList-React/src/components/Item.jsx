/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import stylesheet from "../css/home.module.css";
import { useEffect, useState } from "react";

function Item({id,tarefa,isDone, onremoved, onuseeffectupdateitem}){

    const srcs = [
        "https://cdn.discordapp.com/attachments/741731794772295805/1293328013550944268/check-in.png?ex=6706f913&is=6705a793&hm=2db601a36db622723327c375829a43450987f053cd956812c3eb8a531b1341c4&",
        "https://cdn.discordapp.com/attachments/741731794772295805/1293328013320261714/check-out.png?ex=6706f913&is=6705a793&hm=f4fb8a2761c7a67cfcef2695fe0025328c97c719c1d046f257e19d8c7f1ebe88&"
    ];

    const deco = ["line-through","none"];
    const opac = [0.5,1];

    const [isDoneItem,setIsDoneItem] = useState(isDone);
    const [decoration,setDecoration] = useState(isDone? deco[0] : deco[1]);
    const [iconCheck,setIconCheck] = useState(isDone? srcs[0] : srcs[1]);
    const [opacItem,setOpacItem] = useState(isDone? opac[0]: opac[1]);

    function OnClickItem(){
        if(isDoneItem){          
            setDecoration(deco[1]);
            setIconCheck(srcs[1]);
            setOpacItem(opac[1]);
            let doc = document.getElementById(id);
            let attr = doc.getAttribute("class").split(' ')[0];
            attr += " unDone";
            doc.setAttribute("class",attr);
        }else{
            setDecoration(deco[0]);
            setIconCheck(srcs[0]);
            setOpacItem(opac[0]);
            let doc = document.getElementById(id);
            let attr = doc.getAttribute("class");
            attr = attr.split(' ')[0] + " Done";
            doc.setAttribute("class",attr);
        }
        setIsDoneItem(!isDoneItem);
    }

    useEffect(()=>
    {
        onuseeffectupdateitem(id,document.getElementById(id).getAttribute("class").split(' ')[1]);
    })

    return (
    <div key={id} id={id} className={stylesheet.item + (isDone == true?" Done":" unDone")} onClick={OnClickItem}>
        <img src={iconCheck}/>
        <h2 style={{ textDecoration:decoration, opacity: opacItem, textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden"}}>{tarefa}</h2>
        <button className={stylesheet.btn_delete} onClick={()=> onremoved(id)}>Deletar</button>
    </div>)
}

export default Item