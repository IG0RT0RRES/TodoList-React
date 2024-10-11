/* eslint-disable react/prop-types */

import Item from "./Item";

function ListItens({itens,onremoveitem, onuseeffectupdate}){
    return (<>{itens.map((item)=>(<Item key={item.id} id={item.id} tarefa={item.tarefa} isDone={item.state == "Done"} onremoved={ ()=>onremoveitem(item.id)} onuseeffectupdateitem={onuseeffectupdate}/>))}</>)
}

export default ListItens

     