/* eslint-disable react/prop-types */
import { useEffect } from "react";
import Aos from "aos";
import "aos/dist/aos.css";
import Item from "./Item";

function ListItens({itens,onremoveitem, onuseeffectupdate,onopenpopup}){

    useEffect(()=>{
        Aos.init();
    });

    return (<>{itens.map((item)=>(<Item key={item.id} id={item.id} tarefa={item.tarefa} isDone={item.state == "Done"} onremoved={ ()=>onremoveitem(item.id)} onuseeffectupdateitem={onuseeffectupdate} onopenpopupedit={onopenpopup}/>))}</>)
}

export default ListItens

     