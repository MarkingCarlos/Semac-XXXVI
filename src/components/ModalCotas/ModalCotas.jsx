import { useState } from 'preact/hooks'
import { COTAS }    from '../../data/cotas.js'
import './modalCotas.css'

const EMAIL_COMISSAO = 'patrocinio@semac.com.br'

export default function ModalCotas({ aberto, onFechar }) {
    const [cotaSelecionada, setCotaSelecionada] = useState(null)
    const [nomeEmpresa, setNomeEmpresa]         = useState('')

    if (!aberto) return null

    const cota      = COTAS.find(c => c.id === cotaSelecionada)
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
        <div class="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div class="modal-painel">

                {/* ── Cabeçalho ──────────────────────────────── */}
                <div class="modal-header">
                    <div>
                        <div class="modal-rotulo-linha">
                            <span class="modal-acento" />
                            <span class="modal-rotulo">PATROCÍNIO · SEMAC 2026</span>
                        </div>
                        <h2 class="modal-titulo">ESCOLHA SUA COTA</h2>
                    </div>
                    <button class="modal-fechar" onClick={onFechar} aria-label="Fechar">✕</button>
                </div>
                <p class="modal-subtitulo">
                    Selecione a cota ideal para sua empresa e entre em contato com nossa equipe de patrocínio.
                </p>

                {/* ── Cards das cotas ─────────────────────────── */}
                <div class="modal-cotas-grid">
                    {COTAS.map((c, i) => (
                        <button
                            key={c.id}
                            class={`cota-card ${c.id} ${cotaSelecionada === c.id ? 'cota-card-selecionada' : ''}`}
                            style={{
                                '--cota-fundo':    c.corFundo,
                                '--cota-destaque': c.corDestaque,
                                '--cota-texto':    c.corTexto,
                                // 0.08s iniciais deixam a animação do painel concluir antes dos cards entrarem
                                animationDelay: `${0.08 + i * 0.06}s`,
                            }}
                            onClick={() => setCotaSelecionada(c.id)}
                            aria-pressed={cotaSelecionada === c.id}
                        >
                            <span class="cota-nome">{c.nome}</span>
                            <ul class="cota-beneficios">
                                {c.beneficios.map((b, j) => (
                                    <li key={j} class="cota-beneficio">
                                        <span class="cota-check-icone">✓</span>
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                            {cotaSelecionada === c.id && (
                                <span class="cota-badge-selecionada">SELECIONADA</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Formulário ──────────────────────────────── */}
                <form class="modal-form" onSubmit={handleSubmit}>
                    <div class="modal-campo">
                        <label class="modal-campo-label">Nome da Empresa</label>
                        <input
                            class="modal-campo-input"
                            type="text"
                            placeholder="Ex: Empresa Ltda."
                            value={nomeEmpresa}
                            onInput={e => setNomeEmpresa(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" class="modal-btn-enviar" disabled={!podeEnviar}>
                        {cotaSelecionada
                            ? `Entrar em Contato — Cota ${cota.nome}`
                            : 'Selecione uma cota para continuar'}
                    </button>
                </form>

            </div>
        </div>
    )
}
