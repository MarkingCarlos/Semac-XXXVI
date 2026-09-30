import { useEffect, useRef, useState } from 'preact/hooks';
import ModalVagasMinicursos from './ModalVagasMinicursos.jsx';
import ModalRankingCompleto from './ModalRankingCompleto.jsx';
import ModalLeiturasQr from './ModalLeiturasQr.jsx';
import { usarConsultaPeriodica } from './usarConsultaPeriodica.js';
import {
    buscarMinicursosDashboard,
    buscarRankingDashboard,
    buscarCheckinsDashboard,
} from './data/apiDashboard.js';
import { porcentagem } from './formatoDashboard.js';
import './dashboardAdmin.css';

/* Dashboard da seção Início do /admin (protótipo Figma "SEMAC 2026").
   Cada card mostra o resumo e abre um modal que desce do topo com o
   detalhe. No mobile os cards viram um carrossel com pontos de navegação;
   no desktop ficam lado a lado.

   A leitura de QR se atualiza sozinha (ver usarConsultaPeriodica); vagas
   e ranking são carregados ao abrir a seção. */
export default function DashboardAdmin() {
    const minicursos = usarConsultaPeriodica(buscarMinicursosDashboard);
    const ranking = usarConsultaPeriodica(buscarRankingDashboard);
    const checkins = usarConsultaPeriodica(buscarCheckinsDashboard, true);

    const [modalAberto, setModalAberto] = useState(null); // null | 'minicursos' | 'ranking' | 'qr'
    const fecharModal = () => setModalAberto(null);

    const cards = [
        <CardVagasMinicursos key="minicursos" consulta={minicursos} aoAbrir={() => setModalAberto('minicursos')} />,
        <CardTopRanking key="ranking" consulta={ranking} aoAbrir={() => setModalAberto('ranking')} />,
        <CardLeituraQr key="qr" consulta={checkins} aoAbrir={() => setModalAberto('qr')} />,
    ];

    return (
        <section className="secaoDashboardAdmin" aria-label="Dashboard do evento">
            <CarrosselCardsDashboard cards={cards} />

            {modalAberto === 'minicursos' && minicursos.dados && (
                <ModalVagasMinicursos dados={minicursos.dados} aoFechar={fecharModal} />
            )}
            {modalAberto === 'ranking' && ranking.dados && (
                <ModalRankingCompleto ranking={ranking.dados} aoFechar={fecharModal} />
            )}
            {modalAberto === 'qr' && checkins.dados && (
                <ModalLeiturasQr dados={checkins.dados} aoFechar={fecharModal} />
            )}
        </section>
    );
}

/* ── Carrossel (mobile) / grade (desktop) ───────────────────────── */

function CarrosselCardsDashboard({ cards }) {
    const trilhoRef = useRef(null);
    const [indiceAtivo, setIndiceAtivo] = useState(0);

    // O ponto ativo acompanha o card mais visível no trilho (scroll-snap).
    useEffect(() => {
        const trilho = trilhoRef.current;
        if (!trilho) return undefined;
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) setIndiceAtivo(Number(entrada.target.dataset.indice));
            });
        }, { root: trilho, threshold: 0.6 });
        Array.from(trilho.children).forEach((filho) => observador.observe(filho));
        return () => observador.disconnect();
    }, [cards.length]);

    function irPara(indice) {
        const alvo = trilhoRef.current?.children[indice];
        alvo?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }

    return (
        <div className="carrosselCardsDashboard">
            <div className="trilhoCarrosselCardsDashboard" ref={trilhoRef}>
                {cards.map((card, indice) => (
                    <div className="slideCarrosselCardsDashboard" data-indice={indice} key={card.key}>
                        {card}
                    </div>
                ))}
            </div>
            <div className="pontosCarrosselCardsDashboard" role="group" aria-label="Escolher card">
                {cards.map((card, indice) => (
                    <button
                        key={card.key}
                        type="button"
                        className={`pontoCarrosselCardsDashboard ${indice === indiceAtivo ? 'pontoAtivoCarrosselCardsDashboard' : ''}`}
                        aria-label={`Ir para o card ${indice + 1} de ${cards.length}`}
                        aria-current={indice === indiceAtivo ? 'true' : undefined}
                        onClick={() => irPara(indice)}
                    />
                ))}
            </div>
        </div>
    );
}

/* ── Casca comum dos cards ──────────────────────────────────────── */

/* Card clicável no estilo do protótipo: fundo âmbar, título em Bungee
   branco, subtítulo em Montserrat na cor da diretoria. Enquanto carrega
   ou se falhar, mostra o estado no lugar do conteúdo e não abre modal. */
function CardDashboard({ titulo, subtitulo, consulta, aoAbrir, rotuloAbrir, children }) {
    const pronto = !!consulta.dados;
    return (
        <button
            type="button"
            className="cardDashboard"
            onClick={pronto ? aoAbrir : undefined}
            aria-disabled={!pronto}
            aria-label={pronto ? rotuloAbrir : undefined}
        >
            <span className="tituloCardDashboard">{titulo}</span>
            {pronto ? (
                <>
                    <span className="subtituloCardDashboard">{subtitulo}</span>
                    <span className="conteudoCardDashboard">{children}</span>
                </>
            ) : (
                <span className="estadoCardDashboard">
                    {consulta.erro || 'Carregando...'}
                </span>
            )}
        </button>
    );
}

/* Barra 0%–100% do protótipo, preenchida na cor da diretoria. */
function BarraProgressoCardDashboard({ valor, rotulo }) {
    return (
        <span className="blocoBarraCardDashboard">
            <span className="legendasBarraCardDashboard" aria-hidden="true">
                <span className="legendaInicioBarraCardDashboard">0%</span>
                <span className="legendaFimBarraCardDashboard">100%</span>
            </span>
            <span
                className="trilhoBarraCardDashboard"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={valor}
                aria-label={rotulo}
            >
                <span className="preenchimentoBarraCardDashboard" style={{ width: `${valor}%` }} />
            </span>
        </span>
    );
}

/* ── Cards ──────────────────────────────────────────────────────── */

function CardVagasMinicursos({ consulta, aoAbrir }) {
    const dados = consulta.dados;
    const restantes = dados?.vagasRestantesTotal ?? 0;
    const ocupacao = dados ? porcentagem(dados.inscritosTotal, dados.capacidadeTotal) : 0;
    return (
        <CardDashboard
            titulo="Vagas restantes em minicursos"
            subtitulo={`${restantes} ${restantes === 1 ? 'vaga restante' : 'vagas restantes'}`}
            consulta={consulta}
            aoAbrir={aoAbrir}
            rotuloAbrir={`Vagas restantes em minicursos: ${restantes}. Abrir detalhes por minicurso`}
        >
            <BarraProgressoCardDashboard valor={ocupacao} rotulo={`${ocupacao}% das vagas preenchidas`} />
        </CardDashboard>
    );
}

/* Card é estreito: mostra só os dois primeiros nomes ("Carlos Alberto de
   Souza Junior" → "Carlos Alberto"). Conectivos na segunda posição são
   pulados, senão "Maria da Silva" viraria "Maria da". O nome completo
   segue no title e no modal do ranking. */
const CONECTIVOS_NOME_TOP_RANKING = ['de', 'da', 'do', 'dos', 'das', 'e'];

function abreviarNomeTopRanking(nome) {
    const [primeiroNome, ...demaisNomes] = nome.trim().split(/\s+/);
    const segundoNome = demaisNomes.find(
        (parteNome) => !CONECTIVOS_NOME_TOP_RANKING.includes(parteNome.toLowerCase())
    );
    return segundoNome ? `${primeiroNome} ${segundoNome}` : primeiroNome;
}

function CardTopRanking({ consulta, aoAbrir }) {
    const ranking = consulta.dados ?? [];
    const top3 = ranking.slice(0, 3);
    return (
        <CardDashboard
            titulo="Top 3 do ranking"
            subtitulo={`${ranking.length} participantes pontuando`}
            consulta={consulta}
            aoAbrir={aoAbrir}
            rotuloAbrir="Top 3 do ranking. Abrir ranking completo"
        >
            {top3.length === 0 ? (
                <span className="vazioCardDashboard">Ninguém pontuou ainda.</span>
            ) : (
                <span className="listaTopRankingCardDashboard">
                    {top3.map((participante) => (
                        <span className="linhaTopRankingCardDashboard" key={participante.id}>
                            <span className="posicaoTopRankingCardDashboard">{participante.posicao}º</span>
                            <span className="nomeTopRankingCardDashboard" title={participante.nome}>
                                {abreviarNomeTopRanking(participante.nome)}
                            </span>
                            <span className="xpTopRankingCardDashboard">{participante.xp} XP</span>
                        </span>
                    ))}
                </span>
            )}
        </CardDashboard>
    );
}

/* Mostra o que está acontecendo agora; havendo eventos em paralelo, soma
   as leituras deles. Sem evento no momento, mostra o total geral. */
function CardLeituraQr({ consulta, aoAbrir }) {
    const dados = consulta.dados;
    const agora = dados?.eventosAgora ?? [];
    const lidosAgora = agora.reduce((soma, evento) => soma + evento.leituras, 0);
    const esperadosAgora = agora.reduce((soma, evento) => soma + evento.esperados, 0);

    let subtitulo = `${dados?.totalLeituras ?? 0} QR codes lidos no total`;
    if (agora.length === 1) subtitulo = agora[0].nome;
    if (agora.length > 1) subtitulo = `${agora.length} eventos acontecendo agora`;

    return (
        <CardDashboard
            titulo="Leitura de QR code"
            subtitulo={subtitulo}
            consulta={consulta}
            aoAbrir={aoAbrir}
            rotuloAbrir="Leitura de QR code. Abrir leituras por evento e por membro"
        >
            {agora.length > 0 ? (
                <>
                    <span className="contadorAoVivoCardDashboard">
                        <span className="pontoAoVivoCardDashboard" aria-hidden="true" />
                        Ao vivo · {lidosAgora} de {esperadosAgora} lidos
                    </span>
                    <BarraProgressoCardDashboard
                        valor={porcentagem(lidosAgora, esperadosAgora)}
                        rotulo={`${lidosAgora} de ${esperadosAgora} QR codes lidos`}
                    />
                </>
            ) : (
                <span className="vazioCardDashboard">Nenhum evento acontecendo agora.</span>
            )}
        </CardDashboard>
    );
}
