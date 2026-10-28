import { render } from 'preact'
import { lazy, Suspense } from 'preact/compat'
import './index.css'
import { App } from './app.jsx'
import { Switch, Route, Redirect, useParams } from 'wouter'
import { temAcessoFinanceiro, temAcessoPrevisao, temAcessoAdmin, temAcessoParticipante, temAcessoGamificacao, temAcessoDiretoria } from './auth/sessao.js'

/* Páginas carregadas sob demanda (uma por rota): a home pública (`App`,
   acima) não precisa esperar o JS do /admin, /financeiro, /participantes,
   /sorteio ou /checkin — hoje tudo isso ia num chunk único pra qualquer
   visitante do site. */
const Admin = lazy(() => import('./pages/Admin/Admin.jsx'));
const Inscricao = lazy(() => import('./pages/Inscricao/Inscricao.jsx'));
const PaginaCotas = lazy(() => import('./pages/PaginaCotas/PaginaCotas.jsx'));
const Checkin = lazy(() => import('./components/qrcode/ModalQrCode.jsx'));
const Termo = lazy(() => import('./pages/Termo/termo.jsx'));
const DesafioCifra = lazy(() => import('./pages/DesafioCifra/desafioCifra.jsx'));
const Sorteio = lazy(() => import('./pages/Sorteio/sorteio.jsx'));
const TelaoSorteio = lazy(() => import('./pages/Sorteio/telaoSorteio.jsx'));
const PainelDebate = lazy(() => import('./pages/Debate/painelDebate.jsx'));
const TelaoDebate = lazy(() => import('./pages/Debate/telaoDebate.jsx'));
const Financas = lazy(() => import('./pages/Financas/Financas.jsx'));
const ConjuntosCotacao = lazy(() => import('./pages/Financas/conjuntos/ConjuntosCotacao.jsx'));
const ConjuntoDetalhe = lazy(() => import('./pages/Financas/conjuntos/ConjuntoDetalhe.jsx'));
// import Ranking from "./pages/Ranking/paginaRanking.jsx";
const Participantes = lazy(() => import('./pages/Participantes/Participantes.jsx'));
const PaginaTime = lazy(() => import('./pages/Time/time.jsx'));
const PaginaVisitaMostra = lazy(() => import('./pages/Mostra/PaginaVisitaMostra.jsx'));
const PaginaQuizLaboratorio = lazy(() => import('./pages/Laboratorio/PaginaQuizLaboratorio.jsx'));
const PaginaPerguntas = lazy(() => import('./pages/Perguntas/PaginaPerguntas.jsx'));

function CarregandoRota() {
    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#730835',
            color: '#edecec',
            fontFamily: "'Bungee', sans-serif",
            fontSize: '0.9rem',
            letterSpacing: '0.04em',
        }}>
            CARREGANDO...
        </div>
    );
}


/* temAcessoPrevisao já inclui os papéis do financeiro; quem tem só ela
   entra vendo apenas a aba Previsão (ver Financas.jsx). */
function RotaFinanceiro() {
    return temAcessoPrevisao()
        ? <Financas />
        : <Redirect to="/inscricoes?tab=entrar&next=/financeiro" />;
}

function RotaConjuntosCotacao() {
    return temAcessoFinanceiro()
        ? <ConjuntosCotacao />
        : <Redirect to="/inscricoes?tab=entrar&next=/financeiro/conjuntos" />;
}

function RotaConjuntoDetalhe() {
    return temAcessoFinanceiro()
        ? <ConjuntoDetalhe />
        : <Redirect to="/inscricoes?tab=entrar&next=/financeiro/conjuntos" />;
}

function RotaAdmin() {
    return temAcessoAdmin()
        ? <Admin />
        : <Redirect to="/inscricoes?tab=entrar&next=/admin" />;
}

/* Modo teste do Termo, aberto em nova guia pelo botão "Testar" do
   /admin -> Termo. Mesmo público que cadastra as palavras. */
function RotaTesteTermo() {
    return temAcessoGamificacao()
        ? <Termo modoTeste />
        : <Redirect to="/inscricoes?tab=entrar&next=/admin" />;
}

/* Modo teste da Cifra do Dia, aberto em nova guia pelo botão "Testar" do
   /admin -> Cifra do Dia. Mesmo público que cadastra os desafios. */
function RotaTesteDesafioCifra() {
    return temAcessoGamificacao()
        ? <DesafioCifra modoTeste />
        : <Redirect to="/inscricoes?tab=entrar&next=/admin" />;
}

/* Modo teste do Quiz dos Laboratórios, aberto em nova guia pelo botão
   "Testar" do /admin. Mesmo público que cadastra os laboratórios. */
function RotaTesteQuizLaboratorio() {
    return temAcessoGamificacao()
        ? <PaginaQuizLaboratorio modoTeste />
        : <Redirect to="/inscricoes?tab=entrar&next=/admin" />;
}

function RotaParticipantes() {
    return temAcessoParticipante()
        ? <Participantes />
        : <Redirect to="/inscricoes?tab=entrar&next=/participantes" />;
}

/* /time é o link do QR code do cartão do evento: quem não está logado
   entra e volta direto para a revelação do time. */
function RotaTime() {
    return temAcessoParticipante()
        ? <PaginaTime />
        : <Redirect to="/inscricoes?tab=entrar&next=/time" />;
}

/* /mostra/<codigo> é o link do QR code de cada stand da Mostra Técnica:
   quem não está logado entra e volta direto para registrar a visita. */
function RotaVisitaMostra() {
    const { codigo } = useParams();
    return temAcessoParticipante()
        ? <PaginaVisitaMostra />
        : <Redirect to={`/inscricoes?tab=entrar&next=${encodeURIComponent(`/mostra/${codigo}`)}`} />;
}

/* /laboratorio/<codigo> é o link do QR code de cada laboratório (Quiz dos
   Laboratórios): quem não está logado entra e volta direto para o quiz. */
function RotaQuizLaboratorio() {
    const { codigo } = useParams();
    return temAcessoParticipante()
        ? <PaginaQuizLaboratorio />
        : <Redirect to={`/inscricoes?tab=entrar&next=${encodeURIComponent(`/laboratorio/${codigo}`)}`} />;
}

function RotaCheckin() {
    return temAcessoAdmin()
        ? <Checkin />
        : <Redirect to="/inscricoes?tab=entrar&next=/participantes" />;
}

function RotaSorteio() {
    return temAcessoAdmin()
        ? <Sorteio />
        : <Redirect to="/inscricoes?tab=entrar&next=/sorteio" />;
}

/* Guia projetada no telão, aberta pelo painel do /sorteio. Mesmo público. */
function RotaTelaoSorteio() {
    return temAcessoAdmin()
        ? <TelaoSorteio />
        : <Redirect to="/inscricoes?tab=entrar&next=/sorteio" />;
}

/* Telão do debate: painel do controlador (/debate/<id>) e a guia
   projetada (/debate/<id>/telao), abertos pelo /admin -> Conteúdo. Mesmo
   público que lê as perguntas do debate (diretoria e presidência), já que
   o painel lista as perguntas do público. */
function RotaPainelDebate() {
    const { id } = useParams();
    return temAcessoDiretoria()
        ? <PainelDebate />
        : <Redirect to={`/inscricoes?tab=entrar&next=${encodeURIComponent(`/debate/${id}`)}`} />;
}

function RotaTelaoDebate() {
    const { id } = useParams();
    return temAcessoDiretoria()
        ? <TelaoDebate />
        : <Redirect to={`/inscricoes?tab=entrar&next=${encodeURIComponent(`/debate/${id}`)}`} />;
}

render(
    <Suspense fallback={<CarregandoRota />}>
        <Switch>
            {/*<Route path="/sorteio"><Admin /></Route>*/}
            <Route path="/admin"><RotaAdmin /></Route>
            <Route path="/financeiro"><RotaFinanceiro /></Route>
            <Route path="/financeiro/conjuntos"><RotaConjuntosCotacao /></Route>
            <Route path="/financeiro/conjuntos/:id"><RotaConjuntoDetalhe /></Route>
            <Route path="/inscricoes"><Inscricao /></Route>
            <Route path="/cotas"><PaginaCotas /></Route>
            <Route path="/participantes"><RotaParticipantes /></Route>
            <Route path="/checkin"><RotaCheckin /></Route>
            <Route path="/time"><RotaTime /></Route>
            <Route path="/mostra/:codigo"><RotaVisitaMostra /></Route>
            <Route path="/laboratorio/teste"><RotaTesteQuizLaboratorio /></Route>
            <Route path="/laboratorio/:codigo"><RotaQuizLaboratorio /></Route>
            {/* Pública: professores e convidados perguntam sem login. */}
            <Route path="/perguntas"><PaginaPerguntas /></Route>
            <Route path="/termo/teste"><RotaTesteTermo/></Route>
            <Route path="/termo"><Termo/></Route>
            <Route path="/desafio-cifra/teste"><RotaTesteDesafioCifra/></Route>
            <Route path="/desafio-cifra"><DesafioCifra/></Route>
            <Route path="/sorteio/telao"><RotaTelaoSorteio/></Route>
            <Route path="/sorteio"><RotaSorteio/></Route>
            <Route path="/debate/:id/telao"><RotaTelaoDebate/></Route>
            <Route path="/debate/:id"><RotaPainelDebate/></Route>
            {/*<Route path="/ranking"><Ranking /></Route>*/}
            <Route><App /></Route>
        </Switch>
    </Suspense>,
    document.getElementById('app')
)
