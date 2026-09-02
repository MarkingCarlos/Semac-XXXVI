import EmBreveHeroText from '../../components/emBreve/EmBreveHeroText.jsx';
import EmBreveInfoCard from '../../components/emBreve/EmBreveInfoCard.jsx';
import { DATA_ANUNCIO } from '../../components/emBreve/tokens.js';
import './youtube.css';
import paperTexture from '../../assets/PAPER.png'

const Youtube = () => {
    var programacao = "EXEMPLO AO VIVO";
    var live = {
        aoVivo: true,
        id: "Teste"
    };
    return (
        <section id="Youtube" className="paginaYoutube" >

        <div className="conteudoPrincipal" >
                <div className="subraTitulo">
                    <span className="tracoHorizontal"/>
                    <span className="styleSubraTitulo">Ao Vivo</span>
                    <span className="tracoHorizontal"/>
                </div>
                <div className="cardYoutube">
                    {(() => {
                        if(live.aoVivo){
                            return (
                                <>
                                <h2>{programacao}</h2>
                                <iframe className='live' src={"https://www.youtube.com/embed/" + live.id} title="AO VIVO" frameborder="0" allowfullscreen>
                                </iframe>
                                </>
                            )
                        } else {
                            return (
                                <>
                                <h2><span className='tituloEmBreve'>EM BREVE: </span>{programacao}</h2>
                                </>
                            )
                        }
                    })()}
                </div>
        </div>

        </section>
    );
};

export default Youtube;