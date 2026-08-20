import { render } from 'preact'
import './index.css'
import { App } from './app.jsx'
import { Switch, Route, Redirect } from 'wouter'
import Admin from './pages/Admin/Admin.jsx'
import Inscricao from "./pages/Inscricao/Inscricao.jsx";
import PaginaCotas from "./pages/PaginaCotas/PaginaCotas.jsx";
import Checkin from "./components/qrcode/ModalQrCode.jsx";
import Termo from "./pages/Termo/Termo.jsx";
import Sorteio from "./pages/Sorteio/sorteio.jsx";
import Financas from "./pages/Financas/Financas.jsx";
import ConjuntosCotacao from "./pages/Financas/conjuntos/ConjuntosCotacao.jsx";
import ConjuntoDetalhe from "./pages/Financas/conjuntos/ConjuntoDetalhe.jsx";
// import Ranking from "./pages/Ranking/paginaRanking.jsx";
import Participantes from "./pages/Participantes/Participantes.jsx";
import { temAcessoFinanceiro, temAcessoAdmin, temAcessoParticipante } from './auth/sessao.js'


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

render(
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
        <Route path="/sorteio"><Sorteio/></Route>
        {/*<Route path="/ranking"><Ranking /></Route>*/}
        <Route><App /></Route>
    </Switch>,
    document.getElementById('app')
)
