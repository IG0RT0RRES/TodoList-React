/* eslint-disable react/prop-types */
import { useEffect } from "react";
import Aos from "aos";
import "aos/dist/aos.css";
import Item from "./Item";

function ListItens({itens,onremoveitem, onuseeffectupdate,onopenpopup,updatehome}){

    useEffect(()=>{
        Aos.init();
    });

    return (<>{itens.map((item)=>(<Item key={item.id} Item={item} onremoved={ ()=>onremoveitem(item.id)} onuseeffectupdateitem={onuseeffectupdate} onopenpopupedit={onopenpopup} updatehome={updatehome}/>))}</>)
}

export default ListItens

     