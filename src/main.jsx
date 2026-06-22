import { render } from 'preact'
import './index.css'
import { App } from './app.jsx'
import { Switch, Route, Redirect } from 'wouter'
import Admin from './pages/Admin/Admin.jsx'
import Inscricao from "./pages/Inscricao/Inscricao.jsx";
import PaginaCotas from "./pages/PaginaCotas/PaginaCotas.jsx";
import Financas from "./pages/Financas/Financas.jsx";
// import Ranking from "./pages/Ranking/paginaRanking.jsx";
import { temAcessoFinanceiro, temAcessoAdmin } from './auth/sessao.js'


function RotaFinanceiro() {
    return temAcessoFinanceiro()
        ? <Financas />
        : <Redirect to="/inscricoes?tab=entrar&next=/financeiro" />;
}

function RotaAdmin() {
    return temAcessoAdmin()
        ? <Admin />
        : <Redirect to="/inscricoes?tab=entrar&next=/admin" />;
}

render(
    <Switch>
        {/*<Route path="/sorteio"><Admin /></Route>*/}
        <Route path="/admin"><RotaAdmin /></Route>
        <Route path="/financeiro"><RotaFinanceiro /></Route>
        <Route path="/inscricoes"><Inscricao /></Route>
        <Route path="/cotas"><PaginaCotas /></Route>
        {/*<Route path="/ranking"><Ranking /></Route>*/}
        <Route><App /></Route>
    </Switch>,
    document.getElementById('app')
)
