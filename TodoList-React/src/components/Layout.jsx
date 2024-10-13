/* eslint-disable react/prop-types */
import stylesheet from "../css/layout.module.css"

function Layout({elements}){
    return (
        <div className={stylesheet.layout_container}> 
        {
            elements.map((x)=>{
                console.log(x);
                return x;
            })
        }
        </div>
    )
}

export default Layout