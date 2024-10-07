/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars

import { useState } from "react";

function Item({id,tarefa,isDone}){

    const srcs = ["/src/img/check-in.png","/src/img/check-out.png"];
    const deco = ["line-through","none"];
    const opac = [0.5,1];

    const [isDoneItem,setIsDoneItem] = useState(isDone);
    const [decoration,setDecoration] = useState(deco[1]);
    const [iconCheck,setIconCheck] = useState(srcs[1]);
    const [opacItem,setOpacItem] = useState(opac[1]);

    function OnClickItem(){
        if(isDoneItem){            
            setDecoration(deco[0]);
            setIconCheck(srcs[0]);
            setOpacItem(opac[0]);
        }else{
            setDecoration(deco[1]);
            setIconCheck(srcs[1]);
            setOpacItem(opac[1]);
        }
        setIsDoneItem(!isDoneItem);
    }

    return (
    <div key={id} id={id} className={"item"}>
        <img src={iconCheck} onClick={OnClickItem}/>
        <h2 style={{ textDecoration:decoration, opacity: opacItem}} onClick={OnClickItem} >{tarefa}</h2>
        <button id="btn-delete" onClick={()=> DeleteTarefa(id)} >Deletar</button>
    </div>)
}

function DeleteTarefa(id){
    document.getElementById(id).remove();
}

export default Item