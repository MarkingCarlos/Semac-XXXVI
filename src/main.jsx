import { render } from 'preact'
import { lazy, Suspense } from 'preact/compat'
import './index.css'
import { App } from './app.jsx'
import { Switch, Route, Redirect } from 'wouter'
import { temAcessoFinanceiro, temAcessoAdmin, temAcessoParticipante } from './auth/sessao.js'

/* Páginas carregadas sob demanda (uma por rota): a home pública (`App`,
   acima) não precisa esperar o JS do /admin, /financeiro, /participantes,
   /sorteio ou /checkin — hoje tudo isso ia num chunk único pra qualquer
   visitante do site. */
const Admin = lazy(() => import('./pages/Admin/Admin.jsx'));
const Inscricao = lazy(() => import('./pages/Inscricao/Inscricao.jsx'));
const PaginaCotas = lazy(() => import('./pages/PaginaCotas/PaginaCotas.jsx'));
const Checkin = lazy(() => import('./components/qrcode/ModalQrCode.jsx'));
const Termo = lazy(() => import('./pages/Termo/Termo.jsx'));
const Sorteio = lazy(() => import('./pages/Sorteio/sorteio.jsx'));
const Financas = lazy(() => import('./pages/Financas/Financas.jsx'));
const ConjuntosCotacao = lazy(() => import('./pages/Financas/conjuntos/ConjuntosCotacao.jsx'));
const ConjuntoDetalhe = lazy(() => import('./pages/Financas/conjuntos/ConjuntoDetalhe.jsx'));
// import Ranking from "./pages/Ranking/paginaRanking.jsx";
const Participantes = lazy(() => import('./pages/Participantes/Participantes.jsx'));

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


function RotaFinanceiro() {
    return temAcessoFinanceiro()
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

function RotaParticipantes() {
    return temAcessoParticipante()
        ? <Participantes />
        : <Redirect to="/inscricoes?tab=entrar&next=/participantes" />;
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
            <Route path="/termo"><Termo/></Route>
            <Route path="/sorteio"><RotaSorteio/></Route>
            {/*<Route path="/ranking"><Ranking /></Route>*/}
            <Route><App /></Route>
        </Switch>
    </Suspense>,
    document.getElementById('app')
)
