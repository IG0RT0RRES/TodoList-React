/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import stylesheet from "../css/home.module.css";
import { useState } from "react";

function Item({id,tarefa,isDone, onremoved}){

    const srcs = ["/src/img/check-in.png","/src/img/check-out.png"];
    const deco = ["line-through","none"];
    const opac = [0.5,1];

    const [isDoneItem,setIsDoneItem] = useState(isDone);
    const [decoration,setDecoration] = useState(deco[1]);
    const [iconCheck,setIconCheck] = useState(srcs[1]);
    const [opacItem,setOpacItem] = useState(opac[1]);

    function OnClickItem(){    
        if(isDoneItem){          
            setDecoration(deco[1]);
            setIconCheck(srcs[1]);
            setOpacItem(opac[1]);
        }else{
            setDecoration(deco[0]);
            setIconCheck(srcs[0]);
            setOpacItem(opac[0]);
        }
        setIsDoneItem(!isDoneItem);
    }

    return (
    <div key={id} id={id} className={stylesheet.item} onClick={OnClickItem}>
        <img src={iconCheck}/>
        <h2 style={{ textDecoration:decoration, opacity: opacItem, textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden"}}>{tarefa}</h2>
        <button className={stylesheet.btn_delete} onClick={()=> onremoved(id)}>Deletar</button>
    </div>)
}

export default Item