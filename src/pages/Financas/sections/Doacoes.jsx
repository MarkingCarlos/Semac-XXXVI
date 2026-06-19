import { useState } from 'preact/hooks';
import { formatarCentavos, formatarData, normalizar } from '../utils/moeda.js';
import './doacoes.css';

/* Doações — somente leitura no módulo financeiro. As doações são
   cadastradas pelo administrador (rota /admin) e aqui apenas são
   visualizadas: quem doou, quanto e a soma total. O total entra no
   saldo em caixa (ver Resumo). Valores em centavos. */
export default function Doacoes({ doadores, carregando, erro }) {
    const [filtro, setFiltro] = useState('');

    const totalArrecadado = doadores.reduce((soma, doador) => soma + doador.valor, 0);
    const doadoresFiltrados = filtro.trim()
        ? doadores.filter((doador) => normalizar(doador.nome).includes(normalizar(filtro)))
        : doadores;

    return (
        <div className="conteudoDoacoesFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Doações</h1>
                    <p className="subtituloSecaoFinancas">
                        Doações cadastradas pelo administrador — somente leitura
                    </p>
                </div>
                <div className="filtroTabelaFinancas">
                    <span className="iconeFiltroFinancas">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </span>
                    <input
                        className="entradaFiltroFinancas"
                        type="search"
                        placeholder="Filtrar por doador…"
                        value={filtro}
                        onInput={(e) => setFiltro(e.currentTarget.value)}
                        aria-label="Filtrar doações por doador"
                    />
                </div>
            </header>

            {erro && <p className="avisoErroDoacoesFinancas" role="alert">{erro}</p>}

            {/* ── Faixa de totais ─────────────────────────── */}
            <div className="faixaResumoDoacoesFinancas">
                <div className="itemResumoDoacoesFinancas">
                    <span className="rotuloItemResumoDoacoesFinancas">Total em doações</span>
                    <strong className="valorItemResumoDoacoesFinancas valorDestaqueDoacoesFinancas">
                        {formatarCentavos(totalArrecadado)}
                    </strong>
                </div>
                <div className="itemResumoDoacoesFinancas">
                    <span className="rotuloItemResumoDoacoesFinancas">Doações registradas</span>
                    <strong className="valorItemResumoDoacoesFinancas">{doadores.length}</strong>
                </div>
            </div>

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Doador</th>
                            <th>Valor</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={3} className="celulaVaziaFinancas">
                                    Carregando doações…
                                </td>
                            </tr>
                        )}
                        {!carregando && doadoresFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={3} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhum doador encontrado para esse filtro.'
                                        : 'Nenhuma doação registrada ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && doadoresFiltrados.map((doador) => (
                            <tr key={doador.id}>
                                <td>
                                    <span className="nomeDoadorDoacoesFinancas">{doador.nome}</span>
                                </td>
                                <td className="celulaValorFinancas celulaValorEntradaDoacoesFinancas">
                                    {formatarCentavos(doador.valor)}
                                </td>
                                <td className="celulaDataFinancas">{formatarData(doador.data)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
