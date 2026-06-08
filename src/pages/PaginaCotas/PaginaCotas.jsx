import { useState } from 'preact/hooks'
import { useLocation } from 'wouter'
import { COTAS } from '../../data/cotas.js'
import './paginaCotas.css'

const EMAIL_COMISSAO = 'patrocinio@semac.com.br'

export default function PaginaCotas() {
    const [, navigate] = useLocation()
    const [cotaSelecionada, setCotaSelecionada] = useState(null)
    const [nomeEmpresa, setNomeEmpresa]         = useState('')

    const cota       = COTAS.find(c => c.id === cotaSelecionada)
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

    return (
        <div class="cotas-pagina">
            <div class="cotas-painel">

                {/* ── Cabeçalho ──────────────────────────────── */}
                <div class="cotas-header">
                    <button class="cotas-voltar" onClick={() => navigate('~/')} aria-label="Voltar">
                        ← Voltar
                    </button>
                    <div>
                        <div class="cotas-rotulo-linha">
                            <span class="cotas-acento" />
                            <span class="cotas-rotulo">PATROCÍNIO · SEMAC 2026</span>
                        </div>
                        <h2 class="cotas-titulo">ESCOLHA SUA COTA</h2>
                    </div>
                </div>
                <p class="cotas-subtitulo">
                    Selecione a cota ideal para sua empresa e entre em contato com nossa equipe de patrocínio.
                </p>

                {/* ── Grid das cotas ──────────────────────────── */}
                <div class="cotas-grid">
                    {COTAS.map((c, i) => (
                        <button
                            key={c.id}
                            class={`cota-card ${c.id} ${cotaSelecionada === c.id ? 'cota-card-selecionada' : ''}`}
                            style={{
                                '--cota-fundo':    c.corFundo,
                                '--cota-destaque': c.corDestaque,
                                '--cota-texto':    c.corTexto,
                                animationDelay: `${0.08 + i * 0.06}s`,
                            }}
                            onClick={() => setCotaSelecionada(c.id)}
                            aria-pressed={cotaSelecionada === c.id}
                        >
                            <div class="cota-cabecalho">
                                <span class="cota-nome">{c.nome}</span>
                                {c.preco
                                    ? <span class="cota-preco">{c.preco}</span>
                                    : <span class="cota-preco cota-preco-sob-consulta">Sob consulta</span>
                                }
                            </div>
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
                <form class="cotas-form" onSubmit={handleSubmit}>
                    <div class="cotas-campo">
                        <label class="cotas-campo-label">Nome da Empresa</label>
                        <input
                            class="cotas-campo-input"
                            type="text"
                            placeholder="Ex: Empresa Ltda."
                            value={nomeEmpresa}
                            onInput={e => setNomeEmpresa(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" class="cotas-btn-enviar" disabled={!podeEnviar}>
                        {cotaSelecionada
                            ? `Entrar em Contato — Cota ${cota.nome}`
                            : 'Selecione uma cota para continuar'}
                    </button>
                </form>

            </div>
        </div>
    )
}
