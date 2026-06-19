// Tabela da comissão organizadora: lista pessoas com papel != PARTICIPANTE
// (MEMBRO, DIRETOR_* e PRESIDENTE), com busca por nome ou e-mail.
//
// Ações por linha: alterar a função (entre os papéis de comissão) e
// desativar/reativar o membro (campo `ativo` — preserva o histórico).
// Mesma identidade visual da tabela de participantes; a coluna "Ingresso"
// dá lugar a "Função" (o papel).
//
// Props:
//   comissao    — array de membros da comissão vindo do Admin pai
//   aoAtualizar — (membroAtualizado) => void, após alterar função/ativo

import { useState, useMemo } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { atribuirRole, definirAtivo } from './data/apiParticipantes.js'

// Papéis de comissão e seus rótulos amigáveis (espelham o enum Role).
const PAPEIS_COMISSAO = [
    { valor: 'MEMBRO',             rotulo: 'Membro' },
    { valor: 'DIRETOR_SITE',       rotulo: 'Diretor(a) de Site' },
    { valor: 'DIRETOR_CONTEUDO',   rotulo: 'Diretor(a) de Conteúdo' },
    { valor: 'DIRETOR_PATROCINIO', rotulo: 'Diretor(a) de Patrocínio' },
    { valor: 'DIRETOR_APOIO',      rotulo: 'Diretor(a) de Apoio' },
    { valor: 'PRESIDENTE',         rotulo: 'Presidente' },
]
const ROTULO_ROLE = Object.fromEntries(PAPEIS_COMISSAO.map(p => [p.valor, p.rotulo]))

const ROTULO_MODELO = { NORMAL: 'Normal', BABY_LOOK: 'Baby Look' }

function textoCamiseta(camiseta) {
    if (!camiseta) return '—'
    return `${ROTULO_MODELO[camiseta.modelo] ?? camiseta.modelo} - ${camiseta.tamanho}`
}

export default function TabelaComissao({ comissao, aoAtualizar }) {
    const [busca, setBusca] = useState('')
    const [membroEmEdicao, setMembroEmEdicao] = useState(null)
    const [idConfirmandoDesativar, setIdConfirmandoDesativar] = useState(null)
    const [idProcessando, setIdProcessando] = useState(null)
    const [erroAcao, setErroAcao] = useState('')

    const filtrados = useMemo(() =>
        comissao.filter(membro =>
            membro.nome.toLowerCase().includes(busca.toLowerCase()) ||
            membro.email.toLowerCase().includes(busca.toLowerCase())
        ),
        [comissao, busca]
    )

    async function alternarAtivo(membro) {
        if (idConfirmandoDesativar !== membro.id && membro.ativo) {
            // Desativar exige 2 cliques; reativar é direto.
            setIdConfirmandoDesativar(membro.id)
            return
        }
        setErroAcao('')
        setIdProcessando(membro.id)
        try {
            const atualizado = await definirAtivo(membro.id, !membro.ativo)
            aoAtualizar(atualizado)
        } catch (e) {
            setErroAcao(e.message)
        } finally {
            setIdProcessando(null)
            setIdConfirmandoDesativar(null)
        }
    }

    return (
        <div class="conteinerTabelaAdmin">
            <div class="topoTabelaAdmin">
                <h2 class="tituloTabelaAdmin">Comissão</h2>
                <input
                    class="inputBuscaAdmin"
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={busca}
                    onInput={e => setBusca(e.target.value)}
                />
            </div>

            {erroAcao && <p class="avisoErroModalParticipantesAdmin">{erroAcao}</p>}

            <div class="scrollTabelaAdmin">
                <table class="tabelaAdmin">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>RA</th>
                            <th>Conta</th>
                            <th>Camiseta</th>
                            <th>Função</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 ? (
                            <tr>
                                <td colSpan={6} class="tabelaVaziaAdmin">
                                    Nenhum membro da comissão encontrado.
                                </td>
                            </tr>
                        ) : filtrados.map(membro => (
                            <tr key={membro.id}>
                                <td class="celulaNomeEmailAdmin">
                                    <span class="nomeParticipanteAdmin">{membro.nome}</span>
                                    <span class="emailParticipanteAdmin">{membro.email}</span>
                                </td>
                                <td class="celulaRaAdmin">{membro.ra ?? '—'}</td>
                                <td>
                                    <span class={`badgeContaAdmin ${membro.ativo ? 'badgeContaAtivoAdmin' : 'badgeContaInativoAdmin'}`}>
                                        {membro.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td class="celulaCamisetaAdmin">{textoCamiseta(membro.camiseta)}</td>
                                <td class="celulaFuncaoComissaoAdmin">
                                    <span class="badgeFuncaoComissaoAdmin">
                                        {ROTULO_ROLE[membro.role] ?? membro.role}
                                    </span>
                                </td>
                                <td class="celulaAcaoComissaoAdmin">
                                    <div class="grupoAcoesComissaoAdmin">
                                        <button
                                            type="button"
                                            class="botaoAlterarRoleAdmin"
                                            onClick={() => { setErroAcao(''); setMembroEmEdicao(membro) }}
                                        >
                                            Alterar função
                                        </button>
                                        <button
                                            type="button"
                                            class={`botaoDesativarComissaoAdmin ${idConfirmandoDesativar === membro.id ? 'botaoDesativarConfirmandoComissaoAdmin' : ''}`}
                                            disabled={idProcessando === membro.id}
                                            onClick={() => alternarAtivo(membro)}
                                        >
                                            {idProcessando === membro.id
                                                ? '...'
                                                : !membro.ativo
                                                    ? 'Reativar'
                                                    : idConfirmandoDesativar === membro.id
                                                        ? 'Confirmar'
                                                        : 'Desativar'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div class="rodapeTabelaAdmin">
                Exibindo {filtrados.length} de {comissao.length} membros
            </div>

            {membroEmEdicao && (
                <ModalAlterarFuncao
                    membro={membroEmEdicao}
                    aoFechar={() => setMembroEmEdicao(null)}
                    aoAtualizar={aoAtualizar}
                />
            )}
        </div>
    )
}

// ── Modal de alteração de função ────────────────────────────────
// Troca o papel do membro entre os papéis de comissão (reusa
// PATCH /api/pessoa/{id}/role, que zera o ingresso para não-participantes).
function ModalAlterarFuncao({ membro, aoFechar, aoAtualizar }) {
    const [papel, setPapel] = useState(membro.role)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState(null)

    async function salvar() {
        setSalvando(true)
        setErro(null)
        try {
            const atualizado = await atribuirRole(membro.id, papel, null)
            aoAtualizar(atualizado)
            aoFechar()
        } catch (e) {
            setErro(e.message)
            setSalvando(false)
        }
    }

    return createPortal(
        <div class="overlayModalParticipantesAdmin" onClick={salvando ? undefined : aoFechar}>
            <div class="modalConfirmarParticipantesAdmin" onClick={e => e.stopPropagation()}>
                <h3 class="tituloModalParticipantesAdmin">Alterar função</h3>
                <p class="subtituloModalParticipantesAdmin">
                    Defina o papel de <strong>{membro.nome}</strong> na comissão.
                </p>

                <div class="campoPapelComissaoModalAdmin">
                    <label class="rotuloPapelComissaoModalAdmin" htmlFor="selectAlterarFuncao">
                        Papel na comissão
                    </label>
                    <select
                        id="selectAlterarFuncao"
                        class="selectPapelComissaoModalAdmin"
                        value={papel}
                        onChange={e => setPapel(e.currentTarget.value)}
                    >
                        {PAPEIS_COMISSAO.map(p => (
                            <option key={p.valor} value={p.valor}>{p.rotulo}</option>
                        ))}
                    </select>
                </div>

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
                        disabled={salvando || papel === membro.role}
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
