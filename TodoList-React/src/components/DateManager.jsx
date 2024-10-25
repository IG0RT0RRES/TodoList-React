/* eslint-disable react/prop-types */

import stylesheet from "../css/dateManager.module.css";
import Aos from "aos";
import { useEffect, useState } from "react";
import { Days as days, Now, Tomorrow, AddDays, SomDays } from "../Classes/DateOperations";

function DateManager({setdateshome}){

    const dates = 
    [
        AddDays(Now(),2), // Daqui a dois dias
        AddDays(Now(),3), // Daqui a três dias
        AddDays(Now(),4), // Daqui a quatro dias
        AddDays(Now(),5), // Daqui a cinco dias
        AddDays(Now(),6), // Daqui a seis dias
        AddDays(Now(),7) // Daqui a sete dias
    ];

    const [datesExpired,setdatesExpired] = useState( 
    [
        AddDays(Now(),1), // Daqui a dois dias
        AddDays(Now(),2), // Daqui a três dias
        AddDays(Now(),3), // Daqui a quatro dias
        AddDays(Now(),4), // Daqui a cinco dias
        AddDays(Now(),5), // Daqui a seis dias
        AddDays(Now(),6), // Daqui a sete dias
        AddDays(Now(),7), // Daqui a sete dias
    ]);

    useEffect(()=>{
        Aos.init();
    });

    function GetDateCorrectForIndex(index){
        if(index <= 1){
            return index == 0? Now() : Tomorrow();
        }
        return dates[index - 2];
    }

    function ReatribuiDatesExpired(targetDate){
        let array = [];
        for(let i=0;i<7; i++){
            array.push(SomDays(targetDate,i + 1));
        }
        setdateshome(GetDateCorrectForIndex(document.getElementById("select_for").value),array[document.getElementById("select_expired").value -2]);
        setdatesExpired(array);
    }

    function SetDayForIndex(i){

        switch(i.target.value){
            case "0": // Hoje
            ReatribuiDatesExpired(Now());
            break;
            case "1": // Amanhã
            ReatribuiDatesExpired(Tomorrow());
            break;
            case "2":
            ReatribuiDatesExpired(dates[0]);
            break;
            case "3":
            ReatribuiDatesExpired(dates[1]);
            break;
            case "4":
            ReatribuiDatesExpired(dates[2]);
            break;
            case "5":
            ReatribuiDatesExpired(dates[3]);
            break;
            case "6":
            ReatribuiDatesExpired(dates[4]);
            break;
            case "7":
            ReatribuiDatesExpired(dates[5]);
            break;
            default:
            ReatribuiDatesExpired(Now());
            break;
        }
    }

    return (
    <div className={stylesheet.options}>
        <label className={stylesheet.dateManager_label}>Para:</label>
        <select id="select_for" className={stylesheet.select} onChange={SetDayForIndex}>
            <option value={0}>Hoje: {Now().getDate()}/{Now().getMonth() + 1}/{Now().getFullYear()}</option>
            <option value={1}>Amanhã: {AddDays(Now(),1).getDate()}/{AddDays(Now(),1).getMonth()+1}/{AddDays(Now(),1).getFullYear()}</option>
            {
                dates.map((x,index)=> <option key={index + 2} value={index + 2}>{days[x.getDay()].substring(0,3) + "."} {x.getDate()}/{x.getMonth()+1}/{x.getFullYear()}</option>)
            }
        </select>
        <label style={{color:"white"}} >Até:</label>
        <select id="select_expired" className={stylesheet.select} onChange={()=>{setdateshome(GetDateCorrectForIndex(document.getElementById("select_for").value),datesExpired[document.getElementById("select_expired").value -2]);}}>
        {
            datesExpired.map((x,index)=> <option key={index + 2} value={index + 2}>{days[x.getDay()].substring(0,3) + "."} {x.getDate()}/{x.getMonth()+1}/{x.getFullYear()}</option>)
        }
        </select>
    </div>);
}

export default DateManager