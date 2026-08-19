/* Área do participante — acessível em /participantes, restrita a quem tem
   role PARTICIPANTE (ver auth/sessao.js e main.jsx). Nível, XP, ranking,
   agenda, conquistas e certificados ainda não têm endpoint na API: os
   dados vêm de mockParticipante.js até o backend expor essas rotas. Nome
   e e-mail exibidos são os reais, tirados da sessão. */

import { useState } from 'preact/hooks';
import { useLocation } from 'wouter';
import { lerSessao, limparSessao } from '../../auth/sessao.js';
import './participantes.css';

import QrCrachaParticipantes from './QrCrachaParticipantes.jsx';
import SecaoInicioParticipantes from './sections/SecaoInicioParticipantes.jsx';
import SecaoAgendaParticipantes from './sections/SecaoAgendaParticipantes.jsx';
import SecaoRankingParticipantes from './sections/SecaoRankingParticipantes.jsx';
import SecaoPerfilParticipantes from './sections/SecaoPerfilParticipantes.jsx';

import {
    nivelMockParticipante,
    aulaAgoraMockParticipante,
    aSeguirMockParticipante,
    meuDiaMockParticipante,
    conquistasMockParticipante,
    diasSemanaMockParticipante,
    minicursosMockParticipante,
    palestrasDoDiaMockParticipante,
    rankingMockParticipante,
    comoGanharXpMockParticipante,
    perfilMockParticipante,
    certificadosMockParticipante,
} from './mockParticipante.js';

const ABAS_PARTICIPANTES = [
    { id: 'inicio', rotulo: 'Início' },
    { id: 'agenda', rotulo: 'Agenda' },
    { id: 'ranking', rotulo: 'Ranking' },
    { id: 'perfil', rotulo: 'Perfil' },
];

const TEM_MINICURSO_PARTICIPANTES = true;
const CERTIFICADOS_LIBERADOS_PARTICIPANTES = false;

function iniciaisNomeParticipante(nome) {
    if (!nome) return '';
    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0]?.[0] ?? '';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
}

export default function Participantes() {
    const [, navegar] = useLocation();
    const sessao = lerSessao();
    const nomeParticipante = sessao?.nome ?? 'Participante';
    const emailParticipante = sessao?.email ?? '';
    const iniciais = iniciaisNomeParticipante(nomeParticipante);

    const [abaAtiva, setAbaAtiva] = useState('inicio');
    const [qrAberto, setQrAberto] = useState(false);

    function irPara(aba) {
        setAbaAtiva(aba);
        setQrAberto(false);
    }

    function sair() {
        limparSessao();
        navegar('/');
    }

    return (
        <div className="paginaParticipantes">
            <header className="cabecalhoParticipantes">
                <span className="logoCabecalhoParticipantes">
                    SEMAC <span className="destaqueLogoCabecalhoParticipantes">XXXVI</span>
                </span>

                <nav className="navDesktopParticipantes" aria-label="Seções da área do participante">
                    {ABAS_PARTICIPANTES.map((aba) => (
                        <button
                            key={aba.id}
                            type="button"
                            className={
                                abaAtiva === aba.id
                                    ? 'itemNavDesktopParticipantes itemNavDesktopAtivoParticipantes'
                                    : 'itemNavDesktopParticipantes'
                            }
                            onClick={() => irPara(aba.id)}
                        >
                            {aba.rotulo.toUpperCase()}
                        </button>
                    ))}
                </nav>

                <div className="acoesCabecalhoParticipantes">
                    <button type="button" className="botaoQrCabecalhoParticipantes" onClick={() => setQrAberto(true)}>
                        MEU QR CODE
                    </button>
                    <span className="nomeCabecalhoParticipantes">{nomeParticipante.split(' ')[0]}</span>
                    <div className="avatarCabecalhoParticipantes">{iniciais}</div>
                </div>
            </header>

            <main className="conteudoParticipantes">
                {abaAtiva === 'inicio' && (
                    <SecaoInicioParticipantes
                        nivel={nivelMockParticipante}
                        aulaAgora={aulaAgoraMockParticipante}
                        aSeguir={aSeguirMockParticipante}
                        meuDia={meuDiaMockParticipante}
                        palestrasDoDia={palestrasDoDiaMockParticipante}
                        conquistas={conquistasMockParticipante}
                        minicursos={minicursosMockParticipante}
                        ranking={rankingMockParticipante}
                        temMinicurso={TEM_MINICURSO_PARTICIPANTES}
                        onAbrirQr={() => setQrAberto(true)}
                        onVerRanking={() => irPara('ranking')}
                        onVerAgenda={() => irPara('agenda')}
                    />
                )}
                {abaAtiva === 'agenda' && (
                    <SecaoAgendaParticipantes
                        diasSemana={diasSemanaMockParticipante}
                        temMinicurso={TEM_MINICURSO_PARTICIPANTES}
                        minicursos={minicursosMockParticipante}
                        palestrasDoDia={palestrasDoDiaMockParticipante}
                    />
                )}
                {abaAtiva === 'ranking' && (
                    <SecaoRankingParticipantes ranking={rankingMockParticipante} comoGanharXp={comoGanharXpMockParticipante} />
                )}
                {abaAtiva === 'perfil' && (
                    <SecaoPerfilParticipantes
                        nome={nomeParticipante}
                        email={emailParticipante}
                        iniciais={iniciais}
                        nivel={nivelMockParticipante}
                        perfil={perfilMockParticipante}
                        conquistas={conquistasMockParticipante}
                        certificados={certificadosMockParticipante}
                        certificadosLiberados={CERTIFICADOS_LIBERADOS_PARTICIPANTES}
                        onAbrirQr={() => setQrAberto(true)}
                        onSair={sair}
                    />
                )}
            </main>

            <nav className="navInferiorParticipantes" aria-label="Navegação da área do participante">
                {ABAS_PARTICIPANTES.map((aba) => (
                    <button
                        key={aba.id}
                        type="button"
                        className="itemNavInferiorParticipantes"
                        aria-current={abaAtiva === aba.id ? 'page' : undefined}
                        onClick={() => irPara(aba.id)}
                    >
                        <span className={abaAtiva === aba.id ? 'marcadorNavInferiorAtivoParticipantes' : 'marcadorNavInferiorParticipantes'} />
                        <span className={abaAtiva === aba.id ? 'rotuloNavInferiorAtivoParticipantes' : 'rotuloNavInferiorParticipantes'}>
                            {aba.rotulo.toUpperCase()}
                        </span>
                    </button>
                ))}
            </nav>

            {qrAberto && (
                <div className="sobreposicaoQrParticipantes" onClick={() => setQrAberto(false)}>
                    <div className="modalQrParticipantes" onClick={(evento) => evento.stopPropagation()}>
                        <div className="cabecalhoModalQrParticipantes">
                            <div className="textoCabecalhoModalQrParticipantes">
                                <span className="tituloModalQrParticipantes">MEU CRACHÁ</span>
                                <span className="subtituloModalQrParticipantes">Mostre na entrada da atividade</span>
                            </div>
                            <button
                                type="button"
                                className="botaoFecharModalQrParticipantes"
                                onClick={() => setQrAberto(false)}
                                aria-label="Fechar"
                            >
                                ×
                            </button>
                        </div>
                        <QrCrachaParticipantes tamanho={200} uuidParticipante={sessao?.uuid} />
                        <div className="identidadeModalQrParticipantes">
                            <span className="nomeModalQrParticipantes">{nomeParticipante.toUpperCase()}</span>
                            <span className="inscricaoModalQrParticipantes">{perfilMockParticipante.numeroInscricao}</span>
                        </div>
                        <div className="avisoAgoraModalQrParticipantes">
                            <span className="tagAgoraModalQrParticipantes">AGORA</span>
                            <span className="textoAgoraModalQrParticipantes">
                                {aulaAgoraMockParticipante.horario} · {aulaAgoraMockParticipante.local} —{' '}
                                {aulaAgoraMockParticipante.checkinFeito ? 'check-in já registrado' : 'check-in pendente'}
                            </span>
                        </div>
                        <span className="rodapeModalQrParticipantes">
                            Funciona sem internet. O código é pessoal e não deve ser compartilhado.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
