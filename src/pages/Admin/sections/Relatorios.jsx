// Aba "Relatórios" do /admin — ponto único para os relatórios gerenciais
// da organização. Hoje só existe o de camisetas; novos relatórios entram
// na lista RELATORIOS abaixo, cada um com seu próprio componente.

import { useState } from 'preact/hooks';
import RelatorioCamisetas from './RelatorioCamisetas.jsx';
import './relatorios.css';

const RELATORIOS = [
    { id: 'camisetas', rotulo: 'Camisetas', Componente: RelatorioCamisetas },
];

export default function Relatorios() {
    const [relatorioAtivo, setRelatorioAtivo] = useState(RELATORIOS[0].id);
    const relatorio = RELATORIOS.find((r) => r.id === relatorioAtivo) ?? RELATORIOS[0];
    const Componente = relatorio.Componente;

    return (
        <div class="conteudoRelatoriosAdmin">
            <header class="cabecalhoSecaoFinancas">
                <div>
                    <h1 class="tituloSecaoFinancas">Relatórios</h1>
                    <p class="subtituloSecaoFinancas">Indicadores para apoiar decisões da organização</p>
                </div>
            </header>

            <div class="layoutRelatoriosAdmin">
                <nav class="listaRelatoriosAdmin" aria-label="Relatórios disponíveis">
                    {RELATORIOS.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            class={`itemListaRelatoriosAdmin ${relatorioAtivo === r.id ? 'itemListaRelatoriosAtivoAdmin' : ''}`}
                            aria-current={relatorioAtivo === r.id ? 'true' : undefined}
                            onClick={() => setRelatorioAtivo(r.id)}
                        >
                            {r.rotulo}
                        </button>
                    ))}
                </nav>

                <div class="painelRelatorioAdmin">
                    <Componente />
                </div>
            </div>
        </div>
    );
}
