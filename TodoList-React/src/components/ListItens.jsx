/* eslint-disable react/prop-types */

import Item from "./Item";

function ListItens({itens,onremoveitem}){
    return (<div>{itens.map((item)=>(<Item key={item.id} id={item.id} tarefa={item.tarefa} isDone={false} onremoved={ ()=>onremoveitem(item.id)}/>))}</div>)
}

export default ListItens

     