import { render } from 'preact'
import './index.css'
import { App } from './app.jsx'
import { Switch, Route } from 'wouter'
import Admin from './pages/Admin/Admin.jsx'
import Inscricao from "./pages/Inscricao/Inscricao.jsx";
import PaginaCotas from "./pages/PaginaCotas/PaginaCotas.jsx";
import Financas from "./pages/Financas/Financas.jsx";

render(
    <Switch>
        <Route path="/admin"><Admin /></Route>
        <Route path="/financeiro"><Financas /></Route>
        <Route path="/inscricao"><Inscricao /></Route>
        <Route path="/cotas"><PaginaCotas /></Route>
        <Route><App /></Route>
    </Switch>,
    document.getElementById('app')
)
