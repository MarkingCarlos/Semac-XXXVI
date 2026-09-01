// Editor de camisetas de uma pessoa (participante ou comissão), acionado
// pela TabelaParticipantes/TabelaComissao. Restrito a DIRETOR_SITE e
// PRESIDENTE (mesmo acesso do financeiro — ver auth/sessao.js), tanto no
// backend (SecurityConfig) quanto aqui, escondendo o botão que abre este
// modal.
//
// Lista as camisetas como linhas editáveis (modelo, tamanho, inclusa/avulsa)
// e salva tudo de uma vez via PUT /api/pessoa/{id}/camisetas
// (substitui a lista inteira — replace-all).

import { useState } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { atualizarCamisetas } from './data/apiParticipantes.js'
import './modalEditarCamisetas.css'

const MODELOS = [
    { valor: 'NORMAL', rotulo: 'Normal' },
    { valor: 'BABY_LOOK', rotulo: 'Baby Look' },
]
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG']

const linhaVazia = () => ({ modelo: 'NORMAL', tamanho: 'M', avulsa: false })

export default function ModalEditarCamisetas({ pessoa, aoFechar, aoAtualizado }) {
    const [linhas, setLinhas] = useState(
        (pessoa.camisetas ?? []).map(c => ({
            modelo: c.modelo,
            tamanho: c.tamanho,
            avulsa: !!c.avulsa,
        }))
    )
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState(null)

    function atualizarLinha(indice, campo, valor) {
        setLinhas(linhas.map((linha, i) => (i === indice ? { ...linha, [campo]: valor } : linha)))
    }

    function removerLinha(indice) {
        setLinhas(linhas.filter((_, i) => i !== indice))
    }

    async function salvar() {
        setSalvando(true)
        setErro(null)
        try {
            const atualizado = await atualizarCamisetas(pessoa.id, linhas)
            aoAtualizado(atualizado)
            aoFechar()
        } catch (e) {
            setErro(e.message)
            setSalvando(false)
        }
    }

    return createPortal(
        <div class="overlayModalParticipantesAdmin" onClick={salvando ? undefined : aoFechar}>
            <div class="modalConfirmarParticipantesAdmin modalEditarCamisetasAdmin" onClick={e => e.stopPropagation()}>
                <h3 class="tituloModalParticipantesAdmin">Editar camisetas</h3>
                <p class="subtituloModalParticipantesAdmin">
                    Camisetas de <strong>{pessoa.nome}</strong> — inclusas no kit ou compradas à parte.
                </p>

                <div class="listaLinhasCamisetasAdmin">
                    {linhas.length === 0 && (
                        <p class="vazioLinhasCamisetasAdmin">Nenhuma camiseta cadastrada.</p>
                    )}
                    {linhas.map((linha, indice) => (
                        <div class="linhaCamisetaAdmin" key={indice}>
                            <select
                                class="selectPapelComissaoModalAdmin selectLinhaCamisetaAdmin"
                                value={linha.modelo}
                                disabled={salvando}
                                onChange={e => atualizarLinha(indice, 'modelo', e.currentTarget.value)}
                            >
                                {MODELOS.map(m => (
                                    <option key={m.valor} value={m.valor}>{m.rotulo}</option>
                                ))}
                            </select>
                            <select
                                class="selectPapelComissaoModalAdmin selectLinhaCamisetaAdmin selectTamanhoLinhaCamisetaAdmin"
                                value={linha.tamanho}
                                disabled={salvando}
                                onChange={e => atualizarLinha(indice, 'tamanho', e.currentTarget.value)}
                            >
                                {TAMANHOS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <div class="alternarAvulsaLinhaCamisetaAdmin" role="group" aria-label="Inclusa no kit ou avulsa">
                                <button
                                    type="button"
                                    class={`botaoAlternarAvulsaAdmin ${!linha.avulsa ? 'botaoAlternarAvulsaAtivoAdmin' : ''}`}
                                    disabled={salvando}
                                    onClick={() => atualizarLinha(indice, 'avulsa', false)}
                                >
                                    Inclusa
                                </button>
                                <button
                                    type="button"
                                    class={`botaoAlternarAvulsaAdmin ${linha.avulsa ? 'botaoAlternarAvulsaAtivoAdmin' : ''}`}
                                    disabled={salvando}
                                    onClick={() => atualizarLinha(indice, 'avulsa', true)}
                                >
                                    Avulsa
                                </button>
                            </div>
                            <button
                                type="button"
                                class="botaoRemoverLinhaCamisetaAdmin"
                                aria-label="Remover camiseta"
                                title="Remover"
                                disabled={salvando}
                                onClick={() => removerLinha(indice)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    class="botaoAdicionarLinhaCamisetaAdmin"
                    disabled={salvando}
                    onClick={() => setLinhas([...linhas, linhaVazia()])}
                >
                    + Adicionar camiseta
                </button>

                {erro && <p class="avisoErroModalParticipantesAdmin">{erro}</p>}

                <div class="rodapeModalParticipantesAdmin">
                    <button
                        type="button"
                        class="botaoCancelarModalParticipantesAdmin"
                        onClick={aoFechar}
                        disabled={salvando}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        class="botaoSalvarModalParticipantesAdmin"
                        onClick={salvar}
                        disabled={salvando}
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
