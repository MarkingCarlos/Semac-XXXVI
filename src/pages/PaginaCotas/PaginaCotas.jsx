import { useState } from 'preact/hooks'
import { useLocation } from 'wouter'
import { COTAS } from '../../data/cotas.js'
import './paginaCotas.css'
import paperTexture from "../../assets/PAPER.png";

const EMAIL_COMISSAO = 'patrocinio@semac.cc'

export default function PaginaCotas() {
    const [, navigate] = useLocation()
    const [cotaSelecionada, setCotaSelecionada] = useState(null)
    const [nomeEmpresa, setNomeEmpresa]         = useState('')

    const cota       = COTAS.find(cotaItem => cotaItem.id === cotaSelecionada)
    const podeEnviar = cotaSelecionada && nomeEmpresa.trim()

    function handleSubmit(e) {
        e.preventDefault()
        if (!podeEnviar) return
        const subject = encodeURIComponent(`Interesse em Patrocínio SEMAC — Cota ${cota.nome}`)
        const body    = encodeURIComponent(
            `Olá, equipe SEMAC!\n\nEmpresa: ${nomeEmpresa}\nCota de interesse: ${cota.nome}\n\nAguardamos o retorno de vocês.\n\nAtenciosamente,\n${nomeEmpresa}`
        )
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
        if (isMobile) {
            window.location.href = `mailto:${EMAIL_COMISSAO}?subject=${subject}&body=${body}`
        } else {
            window.open(
                `https://mail.google.com/mail/?view=cm&to=${EMAIL_COMISSAO}&su=${subject}&body=${body}`,
                '_blank'
            )
        }
    }

    return (
        <section class="paginaCotas">
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: `url(${paperTexture})`,
                backgroundSize: '120%',
                backgroundAttachment: 'fixed',
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
                zIndex: 50,
            }} />
            <div class="painelCotas">

                {/* ── Cabeçalho ──────────────────────────────── */}
                <div class="cabecalhoPaginaCotas">
                    <button class="botaoVoltarCotas" onClick={() => navigate('~/')} aria-label="Voltar">
                        ← Voltar
                    </button>
                    <div>
                        <div class="linhaRotuloCotas">
                            <span class="acentoRotuloCotas" />
                            <span class="rotuloCotas">PATROCÍNIO · SEMAC 2026</span>
                        </div>
                        <h2 class="tituloCotas">ESCOLHA SUA COTA</h2>
                    </div>
                </div>
                <p class="subtituloCotas">
                    Selecione a cota ideal para sua empresa e entre em contato com nossa equipe de patrocínio.
                </p>

                {/* ── Grid das cotas ──────────────────────────── */}
                <div class="gradeCotas">
                    {COTAS.map((cotaItem, i) => (
                        <button
                            key={cotaItem.id}
                            class={`cartaoCota ${cotaItem.id} ${cotaSelecionada === cotaItem.id ? 'cartaoCotaSelecionada' : ''}`}
                            style={{
                                '--cota-fundo':    cotaItem.corFundo,
                                '--cota-destaque': cotaItem.corDestaque,
                                '--cota-texto':    cotaItem.corTexto,
                                animationDelay: `${0.08 + i * 0.06}s`,
                            }}
                            onClick={() => setCotaSelecionada(cotaItem.id)}
                            aria-pressed={cotaSelecionada === cotaItem.id}
                        >
                            <div class="cabecalhoCota">
                                <span class="nomeCota">{cotaItem.nome}</span>
                                {cotaItem.preco
                                    ? <span class="precoCota">{cotaItem.preco}</span>
                                    : <span class="precoCota precoCotaSobConsulta">Sob consulta</span>
                                }
                            </div>
                            <ul class="beneficiosCota">
                                {cotaItem.beneficios.map((beneficio, j) => (
                                    <li key={j} class="beneficioCota">
                                        <span class="iconeCheckCota">✓</span>
                                        <span>{beneficio}</span>
                                    </li>
                                ))}
                            </ul>
                            {cotaSelecionada === cotaItem.id && (
                                <span class="badgeCotaSelecionada">SELECIONADA</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Formulário ──────────────────────────────── */}
                <form class="formularioCotas" onSubmit={handleSubmit}>
                    <div class="campoCotas">
                        <label class="rotuloCampoCotas">Nome da Empresa</label>
                        <input
                            class="inputCampoCotas"
                            type="text"
                            placeholder="Ex: Empresa Ltda."
                            value={nomeEmpresa}
                            onInput={e => setNomeEmpresa(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" class="botaoEnviarCotas" disabled={!podeEnviar}>
                        {cotaSelecionada
                            ? `Entrar em Contato — Cota ${cota.nome}`
                            : 'Selecione uma cota para continuar'}
                    </button>
                </form>

            </div>
        </section>
    )
}
