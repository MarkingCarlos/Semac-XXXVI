import { useState } from 'preact/hooks';
import { formatarCentavos, normalizar } from '../utils/moeda.js';
import './inscricoes.css';

/* Inscrições — somente leitura. Cada linha é um participante confirmado
   (role = PARTICIPANTE) com o tipo de ingresso e o valor reais vindos do
   banco. Os dados são carregados em Financas.jsx. */
export default function Inscricoes({ inscricoes, carregando, erro }) {
    const [filtro, setFiltro] = useState('');

    const totalArrecadado = inscricoes.reduce((soma, inscricao) => soma + inscricao.valor, 0);
    const inscricoesFiltradas = filtro.trim()
        ? inscricoes.filter((inscricao) => normalizar(inscricao.nomePessoa).includes(normalizar(filtro)))
        : inscricoes;

    return (
        <div className="conteudoInscricoesFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Inscrições</h1>
                    <p className="subtituloSecaoFinancas">
                        Participantes confirmados — tipo de ingresso e valor pagos
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
                        placeholder="Filtrar por participante…"
                        value={filtro}
                        onInput={(e) => setFiltro(e.currentTarget.value)}
                        aria-label="Filtrar inscrições por participante"
                    />
                </div>
            </header>

            {erro && <p className="avisoErroInscricoes" role="alert">{erro}</p>}

            {/* ── Faixa de totais ─────────────────────────── */}
            <div className="faixaResumoInscricoes">
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Total arrecadado</span>
                    <strong className="valorItemResumoInscricoes valorDestaqueInscricoes">
                        {formatarCentavos(totalArrecadado)}
                    </strong>
                </div>
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Inscritos</span>
                    <strong className="valorItemResumoInscricoes">{inscricoes.length}</strong>
                </div>
            </div>

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Participante</th>
                            <th>Tipo de inscrição</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan={3} className="celulaVaziaFinancas">
                                    Carregando inscrições…
                                </td>
                            </tr>
                        )}
                        {!carregando && inscricoesFiltradas.length === 0 && (
                            <tr>
                                <td colSpan={3} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhum participante encontrado para esse filtro.'
                                        : 'Nenhuma inscrição confirmada ainda.'}
                                </td>
                            </tr>
                        )}
                        {!carregando && inscricoesFiltradas.map((inscricao) => (
                            <tr key={inscricao.id}>
                                <td>
                                    <span className="nomeParticipanteInscricoes">
                                        {inscricao.nomePessoa}
                                    </span>
                                </td>
                                <td>
                                    <span className="seloTipoInscricoes">
                                        {inscricao.tipoInscricao}
                                    </span>
                                </td>
                                <td className="celulaValorFinancas celulaValorEntradaInscricoes">
                                    {formatarCentavos(inscricao.valor)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
