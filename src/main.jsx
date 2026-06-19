import { render } from 'preact'
import './index.css'
import { App } from './app.jsx'
import { Switch, Route, Redirect } from 'wouter'
import Admin from './pages/Admin/Admin.jsx'
import Inscricao from "./pages/Inscricao/Inscricao.jsx";
import PaginaCotas from "./pages/PaginaCotas/PaginaCotas.jsx";
import Financas from "./pages/Financas/Financas.jsx";
import { temAcessoFinanceiro } from './auth/sessao.js'

/* Guard de rota do /financeiro: só DIRETOR_SITE ou PRESIDENTE entram;
   os demais (ou não logados) vão para o login (aba Entrar), com next
   apontando de volta ao /financeiro. Camada de UX — a proteção real
   dos dados é feita pelo backend (Bearer token). */
function RotaFinanceiro() {
    return temAcessoFinanceiro()
        ? <Financas />
        : <Redirect to="/inscricao?tab=entrar&next=/financeiro" />;
}

render(
    <Switch>
        <Route path="/sorteio"><Admin /></Route>
        <Route path="/admin"><Admin /></Route>
        <Route path="/financeiro"><RotaFinanceiro /></Route>
        <Route path="/inscricao"><Inscricao /></Route>
        <Route path="/cotas"><PaginaCotas /></Route>
        <Route><App /></Route>
    </Switch>,
    document.getElementById('app')
)
