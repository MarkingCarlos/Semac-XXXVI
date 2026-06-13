import { useState } from 'preact/hooks';
import { formatarCentavos, formatarData, normalizar } from '../utils/moeda.js';
import './inscricoes.css';

/* Inscrições — somente leitura. As entradas são geradas automaticamente
   quando o organizador confirma um participante (role = PARTICIPANTE).
   O valor é congelado no momento da confirmação. */
export default function Inscricoes({ inscricoes }) {
    const [filtro, setFiltro] = useState('');

    const totalArrecadado = inscricoes.reduce((soma, inscricao) => soma + inscricao.valor, 0);
    const contagemNormais = inscricoes.filter((inscricao) => inscricao.tipoInscricao === 'Ingresso Normal').length;
    const contagemPermanencia = inscricoes.filter((inscricao) => inscricao.tipoInscricao === 'Permanência').length;
    const inscricoesFiltradas = filtro.trim()
        ? inscricoes.filter((inscricao) => normalizar(inscricao.nomePessoa).includes(normalizar(filtro)))
        : inscricoes;

    return (
        <div className="conteudoInscricoesFinancas">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Inscrições</h1>
                    <p className="subtituloSecaoFinancas">
                        Entradas geradas automaticamente na confirmação dos participantes
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

            {/* ── Faixa de totais ─────────────────────────── */}
            <div className="faixaResumoInscricoes">
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Total arrecadado</span>
                    <strong className="valorItemResumoInscricoes valorDestaqueInscricoes">
                        {formatarCentavos(totalArrecadado)}
                    </strong>
                </div>
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Ingressos normais</span>
                    <strong className="valorItemResumoInscricoes">{contagemNormais}</strong>
                </div>
                <div className="itemResumoInscricoes">
                    <span className="rotuloItemResumoInscricoes">Permanência</span>
                    <strong className="valorItemResumoInscricoes">{contagemPermanencia}</strong>
                </div>
            </div>

            <div className="envelopeTabelaFinancas">
                <table className="tabelaFinancas">
                    <thead>
                        <tr>
                            <th>Participante</th>
                            <th>Tipo de inscrição</th>
                            <th>Valor</th>
                            <th>Confirmada em</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inscricoesFiltradas.length === 0 && (
                            <tr>
                                <td colSpan={4} className="celulaVaziaFinancas">
                                    {filtro.trim()
                                        ? 'Nenhum participante encontrado para esse filtro.'
                                        : 'Nenhuma inscrição confirmada ainda.'}
                                </td>
                            </tr>
                        )}
                        {inscricoesFiltradas.map((inscricao) => (
                            <tr key={inscricao.id}>
                                <td>
                                    <span className="nomeParticipanteInscricoes">
                                        {inscricao.nomePessoa}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className={
                                            inscricao.tipoInscricao === 'Permanência'
                                                ? 'seloTipoInscricoes seloPermanenciaInscricoes'
                                                : 'seloTipoInscricoes'
                                        }
                                    >
                                        {inscricao.tipoInscricao}
                                    </span>
                                </td>
                                <td className="celulaValorFinancas celulaValorEntradaInscricoes">
                                    {formatarCentavos(inscricao.valor)}
                                </td>
                                <td className="celulaDataFinancas">
                                    {formatarData(inscricao.dataConfirmacao)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
