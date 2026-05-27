import { render } from 'preact'
import './index.css'
import { App } from './app.jsx'
import { Switch, Route } from 'wouter'
import Admin from './pages/Admin/Admin.jsx'
import Inscricao from "./pages/Inscricao/Inscricao.jsx";
import PatrocinadoresAnteriores from "./pages/PatrocinadoresAnteriores/PatrocinadoresAnteriores.jsx";

render(
    <Switch>
        <Route path="/admin"><Admin /></Route>
        <Route path="/inscricao"><Inscricao /></Route>
        <Route path="/patrocinadores-anteriores"><PatrocinadoresAnteriores /></Route>
        <Route><App /></Route>
    </Switch>,
    document.getElementById('app')
)
