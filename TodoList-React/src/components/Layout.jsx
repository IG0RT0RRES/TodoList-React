/* eslint-disable react/prop-types */
import stylesheet from "../css/layout.module.css"
import Aos from "aos";
import "aos/dist/aos.css";

import { useEffect } from "react";

function Layout({elements}){

    useEffect(()=>{
        Aos.init();
    },[]);

    return (
        <div className={stylesheet.layout_container}> 
        {
            elements.map((x)=>{
                {/* console.log(x); */}
                return x;
            })
        }
        </div>
    )
}

export default Layout