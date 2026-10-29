import { useState, useEffect } from 'preact/hooks';
import { useLocation } from 'wouter';
import { lerSessao } from '../../auth/sessao.js';
import { lerMeuTime, urlMascoteTime, medirMascoteAlongado } from '../Admin/data/apiTimes.js';
import './time.css';

/* /time — revelação do time. É o link do QR code do cartão que o
   participante recebe ao chegar no evento.

   Fluxo do design (Boas-vindas ao Time): leitura do crachá → definindo
   seu time → revelação, com a cor do time inundando a tela a partir do
   centro. O time real já vem do servidor na primeira chamada; as esperas
   dos dois primeiros passos só criam a expectativa.

   Revelação desligada no /admin: vai direto para o /participantes. Quem
   já tinha visto o time pula a espera do sorteio e lê "você já está no". */

const DURACAO_PASSO_LEITURA_MS = 1400;
const DURACAO_PASSO_SORTEIO_MS = 1300;

/* Paleta de cada time na tela de revelação, pela cor fixa do time (vem
   do banco). O laranja pede texto vinho; os outros dois, texto claro. */
const PALETA_CLARA = {
    texto: '#FCF8F5',
    suave: 'rgba(252, 248, 245, 0.8)',
    borda: 'rgba(252, 248, 245, 0.6)',
    ctaFundo: '#E79839',
    ctaTexto: '#730835',
};

const PALETAS_TIME = {
    '#52ABB1': { ...PALETA_CLARA, mancha: '#469197' },
    '#B13571': { ...PALETA_CLARA, mancha: '#962D60' },
    '#E79839': {
        mancha: '#D4862B',
        texto: '#730835',
        suave: 'rgba(115, 8, 53, 0.8)',
        borda: 'rgba(115, 8, 53, 0.5)',
        ctaFundo: '#730835',
        ctaTexto: '#FCF8F5',
    },
};

function paletaDoTime(cor) {
    return PALETAS_TIME[(cor || '').toUpperCase()] ?? { ...PALETA_CLARA, mancha: 'rgba(0, 0, 0, 0.15)' };
}

/* "Carlos Alberto de Souza" → "Carlos Alberto". */
function nomeCurto(nome) {
    return (nome || '').trim().split(/\s+/).slice(0, 2).join(' ');
}

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

export default function PaginaTime() {
    const [, navegar] = useLocation();
    const nomeParticipante = nomeCurto(lerSessao()?.nome);

    /* 'leitura' | 'sorteio' | 'revelacao' | 'aguardando' | 'erro' */
    const [passoTime, setPassoTime] = useState('leitura');
    const [meuTime, setMeuTime] = useState(null);
    const [mensagemErroTime, setMensagemErroTime] = useState('');
    const [tentativaTime, setTentativaTime] = useState(0);
    /* false = preenche o círculo; texto = margem do mascote contido. */
    const [mascoteAlongadoTime, setMascoteAlongadoTime] = useState(false);

    useEffect(() => {
        let montado = true;
        setPassoTime('leitura');

        (async () => {
            try {
                const [dados] = await Promise.all([lerMeuTime(), esperar(DURACAO_PASSO_LEITURA_MS)]);
                if (!montado || !dados) return;

                if (!dados.ativo) {
                    navegar('/participantes', { replace: true });
                    return;
                }
                if (!dados.sorteado) {
                    setPassoTime('aguardando');
                    return;
                }

                /* A medição do mascote corre junto com a espera do sorteio
                   (quem já viu o time só espera a imagem carregar). */
                const medicaoMascote = medirMascoteAlongado(urlMascoteTime(dados.id, dados.mascoteVersao));
                if (!dados.jaRevelado) {
                    setPassoTime('sorteio');
                    await esperar(DURACAO_PASSO_SORTEIO_MS);
                }
                const alongado = await medicaoMascote;
                if (!montado) return;

                setMascoteAlongadoTime(alongado);
                setMeuTime(dados);
                setPassoTime('revelacao');
            } catch (e) {
                if (!montado) return;
                setMensagemErroTime(e.message);
                setPassoTime('erro');
            }
        })();

        return () => { montado = false; };
    }, [tentativaTime]);

    const revelado = passoTime === 'revelacao' && meuTime;
    const paleta = revelado ? paletaDoTime(meuTime.cor) : null;
    const urlMascote = revelado ? urlMascoteTime(meuTime.id, meuTime.mascoteVersao) : null;

    /* As cores do time entram como variáveis CSS no container: o fundo
       que inunda a tela, os blocos e os botões leem daqui. */
    const estiloPaleta = revelado
        ? {
            '--corFundoTime': meuTime.cor,
            '--corManchaTime': paleta.mancha,
            '--corTextoTime': paleta.texto,
            '--corTextoSuaveTime': paleta.suave,
            '--corBordaTime': paleta.borda,
            '--corCtaFundoTime': paleta.ctaFundo,
            '--corCtaTextoTime': paleta.ctaTexto,
        }
        : undefined;

    return (
        <main className={revelado ? 'paginaTime paginaReveladaTime' : 'paginaTime'} style={estiloPaleta}>
            {revelado && <div className="circuloInundacaoTime" aria-hidden="true" />}

            <header className="cabecalhoTime">
                <span className="marcaCabecalhoTime">
                    SEMAC <span className="acentoMarcaCabecalhoTime">XXXVI</span>
                </span>
                {nomeParticipante && <span className="nomeParticipanteCabecalhoTime">{nomeParticipante}</span>}
            </header>

            {passoTime === 'leitura' && (
                <section className="passoCentralTime" aria-live="polite">
                    <div className="molduraLeituraTime" aria-hidden="true">
                        <div className="linhaLeituraTime" />
                    </div>
                    <div className="textosPassoTime">
                        <h1 className="tituloPassoTime">LENDO SEU CRACHÁ</h1>
                        <p className="descricaoPassoTime">Só um instante…</p>
                    </div>
                </section>
            )}

            {passoTime === 'sorteio' && (
                <section className="passoCentralTime" aria-live="polite">
                    <div className="aneisSorteioTime" aria-hidden="true">
                        <div className="anelSorteioTime anelLaranjaSorteioTime" />
                        <div className="anelSorteioTime anelAzulSorteioTime" />
                        <div className="anelSorteioTime anelRosaSorteioTime" />
                        <span className="rotuloAneisSorteioTime">TIME?</span>
                    </div>
                    <div className="textosPassoTime">
                        <h1 className="tituloPassoTime">DEFININDO SEU TIME</h1>
                        <p className="descricaoPassoTime">São 3 times na SEMAC. Você fica no mesmo time os 4 dias.</p>
                    </div>
                </section>
            )}

            {passoTime === 'aguardando' && (
                <section className="passoCentralTime">
                    <div className="textosPassoTime">
                        <h1 className="tituloPassoTime">TIMES AINDA NÃO SORTEADOS</h1>
                        <p className="descricaoPassoTime">
                            A organização ainda não fez o sorteio. Escaneie o cartão de novo daqui a pouco.
                        </p>
                    </div>
                    <a className="botaoSecundarioTime" href="/participantes">IR PARA A PLATAFORMA</a>
                </section>
            )}

            {passoTime === 'erro' && (
                <section className="passoCentralTime" role="alert">
                    <div className="textosPassoTime">
                        <h1 className="tituloPassoTime">NÃO DEU CERTO</h1>
                        <p className="descricaoPassoTime">{mensagemErroTime}</p>
                    </div>
                    <button type="button" className="botaoPrincipalTime" onClick={() => setTentativaTime((n) => n + 1)}>
                        TENTAR DE NOVO
                    </button>
                </section>
            )}

            {revelado && (
                <section className="passoRevelacaoTime" aria-live="polite">
                    <div className="conteudoRevelacaoTime">
                        <span className="chamadaRevelacaoTime">
                            {meuTime.jaRevelado ? 'VOCÊ JÁ ESTÁ NO' : 'BEM-VINDO AO'}
                        </span>

                        <div className="envoltorioMascoteTime">
                            <div className="haloMascoteTime" />
                            <div className="circuloMascoteTime">
                                {urlMascote
                                    ? (
                                        <img
                                            className={mascoteAlongadoTime ? 'imgMascoteTime imgMascoteContidoTime' : 'imgMascoteTime'}
                                            style={mascoteAlongadoTime ? { padding: mascoteAlongadoTime } : undefined}
                                            src={urlMascote}
                                            alt={`Mascote do ${meuTime.nome}`}
                                        />
                                    )
                                    : <span className="inicialMascoteTime" aria-hidden="true">{inicialDoTime(meuTime.nome)}</span>}
                            </div>
                        </div>

                        <div className="blocoNomeTime">
                            <h1 className="nomeTime">{meuTime.nome}</h1>
                            <p className="fraseTime">Vocês somam pontos juntos nos 4 dias de evento.</p>
                        </div>

                        <div className="gradeNumerosTime">
                            <div className="cartaoNumeroTime">
                                <span className="valorNumeroTime">{meuTime.integrantes}</span>
                                <span className="rotuloNumeroTime">INTEGRANTES</span>
                            </div>
                            {/* Ranking oculto no /admin: posição e XP do time
                                vêm zerados do backend e trocam por "?". */}
                            <div className="cartaoNumeroTime">
                                <span className="valorNumeroTime">{meuTime.rankingOculto ? '?' : `${meuTime.posicao}º`}</span>
                                <span className="rotuloNumeroTime">ENTRE TIMES</span>
                            </div>
                            <div className="cartaoNumeroTime">
                                <span className="valorNumeroTime">{meuTime.rankingOculto ? '?' : meuTime.xpTime.toLocaleString('pt-BR')}</span>
                                <span className="rotuloNumeroTime">XP MÉDIO</span>
                            </div>
                        </div>

                        <p className="notaXpTime">
                            {meuTime.rankingOculto
                                ? 'O ranking dos times está oculto por enquanto, mas cada presença sua continua contando na média do time.'
                                : 'Cada presença sua também conta na média do time.'}
                        </p>

                        <div className="acoesRevelacaoTime">
                            <a className="botaoPrincipalTime" href="/participantes">IR PARA A PLATAFORMA</a>
                            <a className="botaoSecundarioTime" href="/participantes?tab=agenda">IR PARA MINHA AGENDA</a>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}

/* "TIME ONDA" → "O": o placeholder do círculo enquanto não há mascote. */
function inicialDoTime(nome) {
    const palavras = (nome || '').trim().split(/\s+/);
    const principal = palavras.length > 1 && palavras[0].toUpperCase() === 'TIME' ? palavras[1] : palavras[0];
    return (principal || '?').charAt(0);
}
