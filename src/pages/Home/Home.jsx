import { useState, useEffect } from 'preact/hooks'
import { useLocation } from 'wouter'
import { createPortal } from 'preact/compat'
import { lerConfiguracaoInscricao } from '../Admin/data/apiConfiguracaoInscricao.js'
import { temSessaoValida, temAcessoAdmin, temAcessoParticipante } from '../../auth/sessao.js'
import waveUpHome from '/src/assets/waveCima.svg'
import waveUpHomeMobile from '/src/assets/waveCimaMobile.svg'
import waveDownHomeMobile from '/src/assets/waveBaixoMobile.svg'
import waveDownHome from '/src/assets/waveBaixo.svg'
import logoSemac from '/src/assets/semacPolaridLongo.png'
import fotos from '/src/assets/fotosHome.png'
import './home.css'

const ANO_EDICAO = new Date().getFullYear()

/* Botão do topo da Home. Quem já tem sessão vê "Entrar" e vai direto para
   a própria área, sem passar pelo login de novo; quem ainda aguarda a
   confirmação do pagamento não tem área, então cai no login. Sem sessão,
   segue o interruptor de inscrições do /admin: abertas → "Inscreva-se";
   fechadas → "Entrar" (a caixa de /inscricoes vira só login). */
function botaoTopoHome(inscricoesAbertas) {
    if (temSessaoValida()) {
        if (temAcessoAdmin())        return { texto: 'Entrar', destino: '/admin' }
        if (temAcessoParticipante()) return { texto: 'Entrar', destino: '/participantes' }
        return { texto: 'Entrar', destino: '/inscricoes?tab=entrar' }
    }
    return inscricoesAbertas
        ? { texto: 'Inscreva-se', destino: '/inscricoes' }
        : { texto: 'Entrar', destino: '/inscricoes?tab=entrar' }
}

const Home = () =>{
    const [, navigate] = useLocation()
    const [inscricoesAbertas, setInscricoesAbertas] = useState(true)

    useEffect(() => {
        let ativo = true
        lerConfiguracaoInscricao(ANO_EDICAO)
            .then((aberta) => { if (ativo) setInscricoesAbertas(aberta) })
            .catch(() => { /* página pública não exibe erro de API */ })
        return () => { ativo = false }
    }, [])

    const botaoTopo = botaoTopoHome(inscricoesAbertas)

    return (
        <div id="home" className="conteinerPaginaHome">
            <img src={fotos} className="imagemFotosHome" alt="fotos home" />

                <img src={logoSemac} className="imagemLogoHome" alt="LOGO SEMAC" />

            {createPortal(
                <button
                    type="button"
                    className="botaoInscrevaSeHome"
                    onClick={() => navigate(botaoTopo.destino)}
                >
                    {botaoTopo.texto}
                </button>,
                document.body,
            )}
            <img src={waveUpHome}       className="ondaCimaHome ondaCimaHomeDesktop" alt="WaveHome logo" />
            <img src={waveUpHomeMobile} className="ondaCimaHome ondaCimaHomeMobile"  alt="WaveHome logo" />
            <img src={waveDownHome}       className="ondaBaixoHome ondaBaixoHomeDesktop" alt="WaveHome logo" />
            <img src={waveDownHomeMobile} className="ondaBaixoHome ondaBaixoHomeMobile"  alt="WaveHome logo" />
        </div>
    )

}

export default Home;
