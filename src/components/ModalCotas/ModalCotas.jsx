import { useState } from 'preact/hooks'
import { COTAS }    from '../../data/cotas.js'
import './modalCotas.css'

const EMAIL_COMISSAO = 'patrocinio@semac.cc'

export default function ModalCotas({ aberto, onFechar }) {
    const [cotaSelecionada, setCotaSelecionada] = useState(null)
    const [nomeEmpresa, setNomeEmpresa]         = useState('')

    if (!aberto) return null

    const cota      = COTAS.find(cotaItem => cotaItem.id === cotaSelecionada)
    const podeEnviar = cotaSelecionada && nomeEmpresa.trim()

    function handleSubmit(e) {
        e.preventDefault()
        if (!podeEnviar) return
        const subject = encodeURIComponent(`Interesse em Patrocínio SEMAC — Cota ${cota.nome}`)
        const body    = encodeURIComponent(
            `Olá, equipe SEMAC!\n\nEmpresa: ${nomeEmpresa}\nCota de interesse: ${cota.nome}\n\nAguardamos o retorno de vocês.\n\nAtenciosamente,\n${nomeEmpresa}`
        )
        window.location.href = `mailto:${EMAIL_COMISSAO}?subject=${subject}&body=${body}`
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) onFechar()
    }

    return (
        <div class="overlayModalCotas" onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div class="painelModalCotas">

                {/* ── Cabeçalho ──────────────────────────────── */}
                <div class="cabecalhoModalCotas">
                    <div>
                        <div class="linhaRotuloModalCotas">
                            <span class="acentoRotuloModalCotas" />
                            <span class="rotuloModalCotas">PATROCÍNIO · SEMAC 2026</span>
                        </div>
                        <h2 class="tituloModalCotas">ESCOLHA SUA COTA</h2>
                    </div>
                    <button class="botaoFecharModalCotas" onClick={onFechar} aria-label="Fechar">✕</button>
                </div>
                <p class="subtituloModalCotas">
                    Selecione a cota ideal para sua empresa e entre em contato com nossa equipe de patrocínio.
                </p>

                {/* ── Cards das cotas ─────────────────────────── */}
                <div class="gradeCotasModal">
                    {COTAS.map((cotaItem, i) => (
                        <button
                            key={cotaItem.id}
                            class={`cartaoCota ${cotaItem.id} ${cotaSelecionada === cotaItem.id ? 'cartaoCotaSelecionada' : ''}`}
                            style={{
                                '--cota-fundo':    cotaItem.corFundo,
                                '--cota-destaque': cotaItem.corDestaque,
                                '--cota-texto':    cotaItem.corTexto,
                                // 0.08s iniciais deixam a animação do painel concluir antes dos cards entrarem
                                animationDelay: `${0.08 + i * 0.06}s`,
                            }}
                            onClick={() => setCotaSelecionada(cotaItem.id)}
                            aria-pressed={cotaSelecionada === cotaItem.id}
                        >
                            <span class="nomeCota">{cotaItem.nome}</span>
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
                <form class="formularioModalCotas" onSubmit={handleSubmit}>
                    <div class="campoModalCotas">
                        <label class="rotuloCampoModalCotas">Nome da Empresa</label>
                        <input
                            class="inputCampoModalCotas"
                            type="text"
                            placeholder="Ex: Empresa Ltda."
                            value={nomeEmpresa}
                            onInput={e => setNomeEmpresa(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" class="botaoEnviarModalCotas" disabled={!podeEnviar}>
                        {cotaSelecionada
                            ? `Entrar em Contato — Cota ${cota.nome}`
                            : 'Selecione uma cota para continuar'}
                    </button>
                </form>

            </div>
        </div>
    )
}
