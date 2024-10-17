/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import stylesheet from "../css/home.module.css";
import Aos from "aos";
import "aos/dist/aos.css";

function Header({title, addnewitem,setdateshome}){

    const days = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
    const dates = 
    [
        AddDays(new Date(),2), // Daqui a dois dias
        AddDays(new Date(),3), // Daqui a três dias
        AddDays(new Date(),4), // Daqui a quatro dias
        AddDays(new Date(),5), // Daqui a cinco dias
        AddDays(new Date(),6), // Daqui a seis dias
        AddDays(new Date(),7), // Daqui a sete dias
    ];
    
    const [date,setDates] = useState([new Date(),new Date()]);

    useEffect(()=>{
        Aos.init();
        setdateshome(date[0],date[1]);
    });

    const dateNow = new Date();

    function AddDays(date,counts){
        date.setDate(date.getDate() + counts);
        return date;
    }

    return (
        <header className={stylesheet.container}>    
            <h1 data-aos="fade-left">{title}</h1>
            <input id="input" className={stylesheet.input} type="text" placeholder="Digite a tarefa..."  onKeyDown={(e)=>{e.keyCode =="13" && addnewitem()}}/>
            <button className={stylesheet.btn_add} onClick={addnewitem}>Adicionar</button>
            {/* <div className={stylesheet.header_options}>
                <label style={{color:"white"}} >Para:</label>
                <select className={stylesheet.header_select} onChange={(datevalue)=> setDates([datevalue,date[1]])}>
                    <option value={new Date()}>Hoje {dateNow.getDate()}/{dateNow.getMonth() + 1}/{dateNow.getFullYear()}</option>
                    <option value={AddDays(new Date(),1)}>Amanhã {AddDays(new Date(),1).getDate()}/{AddDays(new Date(),1).getMonth()+1}/{AddDays(new Date(),1).getFullYear()}</option>
                    {
                        dates.map((x)=> <option key={x.getDate()} value={x}>{days[x.getDay()].substring(0,3) + "."} {x.getDate()}/{x.getMonth()+1}/{x.getFullYear()}</option>)
                    }
                </select>
                <label style={{color:"white"}} >Expira:</label>
                <select className={stylesheet.header_select} onChange={ (datevalue)=> setDates([date[0],datevalue])}>
                    <option value={dateNow}>Hoje {dateNow.getDate()}/{dateNow.getMonth() + 1}/{dateNow.getFullYear()}</option>
                    <option value={AddDays(new Date(),1)}>Amanhã {AddDays(new Date(),1).getDate()}/{AddDays(new Date(),1).getMonth()+1}/{AddDays(new Date(),1).getFullYear()}</option>
                    {
                        dates.map((x)=> <option key={x.getDate()} value={x}>{days[x.getDay()].substring(0,3) + "."} {x.getDate()}/{x.getMonth()+1}/{x.getFullYear()}</option>)
                    }
                </select>
            </div> */}
        </header>)
}

export default Header