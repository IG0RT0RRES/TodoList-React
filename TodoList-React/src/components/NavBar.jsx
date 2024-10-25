/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import Aos from "aos";
import "aos/dist/aos.css";

import styleSheet from "../css/navbar.module.css";
import { useEffect } from "react";
import Filter from "./Filter";

function NavBar({contact, callbackfilter}){

    useEffect(()=>{
        Aos.init();
    });

    return (
        <nav data-aos="fade-down" className={styleSheet.nav_bar}>
            <div className={styleSheet.navbar_container}>
                <div className={styleSheet.navbar_container_options}>
                    <Filter onfiltercallback={callbackfilter}/>
                </div>
                <p>{contact}</p>
            </div>
            <hr></hr>
        </nav>)
}

export default NavBar