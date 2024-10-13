/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import Aos from "aos";
import "aos/dist/aos.css";
import styleSheet from "../css/navbar.module.css";
import { useEffect } from "react";

function NavBar({contact}){

    useEffect(()=>{
        Aos.init();
    },[]);

    return (
        <nav data-aos="fade-down" className={styleSheet.nav_bar}>
            <div className={styleSheet.navbar_container}>
                <p>{contact}</p>
                <hr></hr>
            </div>
        </nav>)
}

export default NavBar