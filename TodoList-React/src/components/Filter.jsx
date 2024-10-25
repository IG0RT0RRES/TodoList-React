/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import styleSheet from "../css/filter.module.css";
import { DateComparison, IsConclued, IsExpired, IsPendent, Now } from "../Classes/DateOperations";
import Tarefa from "../Classes/Tarefa";

function Filter({onfiltercallback}){

    const filters = 
    [
        {
            "Name": "Todas",
            "Filter": (listItens)=>{
                if(Array.isArray(listItens)){
                    return listItens;
                }
                return null;
            }
        },
        {
            "Name":"Pendentes",
            "Filter": (listItens)=>{
                if(Array.isArray(listItens)){
                    return listItens.filter((elem)=>{
                    return IsPendent(Tarefa.GetDefaultDate(elem.conclusao), Tarefa.GetDefaultDate(elem.expiracao), Tarefa.GetDefaultDate(elem.validade));
                    })
                }
                return null;
            }
        },
        {
            "Name":"Concluidas",
            "Filter": (listItens)=>{
                if(Array.isArray(listItens)){
                    return listItens.filter((elem)=>{
                        return IsConclued(Tarefa.GetDefaultDate(elem.conclusao));
                    })
                }
                return null;                
            }
        },
        {
            "Name":"Expiradas",
            "Filter": (listItens)=>{
                if(Array.isArray(listItens)){
                    return listItens.filter((elem)=>{
                        return IsExpired(Tarefa.GetDefaultDate(elem.conclusao),Tarefa.GetDefaultDate(elem.expiracao));
                    })
                }
                return null;
            }
        }
    ];

    const [index,setIndex] = useState(()=>{
        let indexfilter = localStorage.getItem("filter");
        (indexfilter != undefined && indexfilter != null) &&  (indexfilter = parseInt(indexfilter.substring(indexfilter.length - 1,indexfilter.length)));
        return (indexfilter != undefined && indexfilter != null)? indexfilter : 0;
    });    

    function OnClick(){
        let indexObtido = index >= (filters.length - 1)? 0 : index + 1;
        onfiltercallback(filters[indexObtido].Filter);
        setIndex(indexObtido);
    }

    useEffect(()=>{
        localStorage.setItem("filter",index);

        return ()=>{
            console.log("Limpeza Filter...");
        };
        
    },[index]);

    return (<button onClick={OnClick} className={styleSheet.container_filter}>{filters[index].Name}</button>);
}

export default Filter