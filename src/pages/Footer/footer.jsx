import logoSemac from '/src/assets/Logo_SEMAC.png'
import './footer.css'

const Footer = () =>{

    return (
        <div className="footer-container">
            <div className="footer">
                <div className="divLogo">
                    <img src={logoSemac}/>
                    <p className="subtitulo">XXXVII Semana da Computação dO IBILCE É Um evento feito por alunos para alunos.</p>
                </div>
                <div className="divSecoes">
                    <div>
                        <h2>EVENTO</h2>
                        <a href=""><p>SOBRE</p></a>
                        <a href=""><p>PROGRAMAÇÃO</p></a>
                        <a href=""><p>PATROCINADORES</p></a>
                        <a href=""><p>DOAÇÃO</p></a>
                        <a href=""><p>EQUIPE</p></a>
                    </div>
                    <div>
                        <h2>PARTICIPE</h2>
                        <a href=""><p>INSCRIÇÃO</p></a>
                        <a href=""><p>PATROCINE</p></a>
                        <a href=""><p>APOIE</p></a>
                    </div>
                    <div>
                        <h2>CONTATO</h2>
                        <a href=""><p><u>contato@semac.com</u></p></a>
                        <a href=""><p>UNESP - SÃO JOSÉ DO RIO PRETO</p></a>
                        <a href=""><p>AJUDA</p></a>
                    </div>
                </div>
            </div>
            <p className="copyright">© 2026 SEMAC — XXXVI Semana da Computação · IBILCE/UNESP</p>
        </div>
    )

}

export default Footer;