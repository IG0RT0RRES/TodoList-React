/* eslint-disable no-unused-vars */
import { FaFacebookSquare } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FaSquareYoutube } from "react-icons/fa6";
import { FaSquareInstagram } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";

import styleSheet from "../css/footer.module.css"

function Footer(){
    return (
        <div className={styleSheet.footer_container}>
            <div className={styleSheet.icons}>
                <a href="https://web.facebook.com/igor.torres.54738" target="_blank"><FaFacebookSquare className={styleSheet.ico} /*style={{color:"#27557a"}}*//></a>
                <a href="https://x.com/IgorTorres234" target="_blank"><FaSquareXTwitter className={styleSheet.ico} /*style={{color:"#27557a"}}*//></a>
                <a href="https://www.youtube.com/@Dev.Mobile" target="_blank"><FaSquareYoutube className={styleSheet.ico} /*style={{color:"red"}}*//></a>
                <a href="https://www.instagram.com/m_igortorres/" target="_blank"><FaSquareInstagram className={styleSheet.ico} /*style={{color:"pink"}}*//></a>
            </div>
            <hr style={{marginLeft:"10%", marginRight:"10%"}}></hr>
            <h2>TODOLIST.BR</h2>
            <p>Atendimento de segunda a sexta-feira, das 6h às 21h</p>
            <div className={styleSheet.container_contato}>
                <p>Telefones: 
                    <a href="https://wa.me/+5521965442847?text=Ol%C3%A1,%20peguei%20seu%20contato%20no%20site%20!" target="_blank">(21)96544-2847</a> / 
                    <a href="https://wa.me/+5521965442847?text=Ol%C3%A1,%20peguei%20seu%20contato%20no%20site%20!" target="_blank">(21)96544-2847</a> / 
                    <a href="https://wa.me/+5521965442847?text=Ol%C3%A1,%20peguei%20seu%20contato%20no%20site%20!" target="_blank">(21)96544-2847</a>
                </p>
            </div>
            <p>Avenida Presidente Fulano, 777 - Centro, Rio de Janeiro - RJ | 77.777 - 777</p>
            <div className={styleSheet.container_ouvidoria}>
                <MdEmail className={styleSheet.ico_ouvidoria}/>
                <a className={styleSheet.ouvidoria} href="mailto:igortorres234@gmail.com?subject=Programador Web&cc=&bcc=&body=Olá, estou entrando em contato pelo email disponivel no site TodoList-BR" target="_blank">Enviar Email</a>            
            </div>
            <p className={styleSheet.copyright}>Copyright © APP TODOLIST-BR - PORTAL DO DESENVOLVIMENTO DE APLICAÇOES DO RIO DE JANEIRO - TODOLIST-BR</p>
        </div>)
}

export default Footer