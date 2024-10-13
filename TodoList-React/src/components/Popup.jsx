/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import stylesheet from "../css/popup.module.css";
import Aos from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

function Popup({tarefaedit}){

    useEffect(()=>{
        Aos.init();
    });

    return (
        <div className={stylesheet.pop_up}>
            <p>Pop-up</p>
            <input type="text" placeholder={tarefaedit}/>
        </div>
    )
}

export default Popup