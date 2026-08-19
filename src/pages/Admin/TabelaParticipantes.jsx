// Tabela de participantes com busca em tempo real por nome ou e-mail.
//
// Cada linha exibe: nome (com e-mail abaixo), RA, status da conta,
// a camiseta escolhida na inscrição e a ação de confirmação.
// A filtragem é feita no cliente — quando houver muitos participantes,
// considerar mover para query params na API (?busca=...).
//
// Props:
//   participantes — array completo de participantes vindo do Admin pai
//   aoConfirmar   — (idPessoa, novoRole) => void, chamado após confirmar

import { useState, useMemo } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { atribuirRole } from './data/apiParticipantes.js'
import { listarTiposInscricao } from './data/apiTipoInscricao.js'
import { formatarCentavos } from '../Financas/utils/moeda.js'

const ANO_ATUAL = new Date().getFullYear()

// Rótulos legíveis dos enums de camiseta (espelham o backend).
const ROTULO_MODELO = { NORMAL: 'Normal', BABY_LOOK: 'Baby Look' }

// Categorias de papel oferecidas na confirmação da inscrição.
const OPCOES_ROLE = [
    { valor: 'PARTICIPANTE', rotulo: 'Participante', descricao: 'Inscrito no evento' },
    { valor: 'MEMBRO',       rotulo: 'Membro',       descricao: 'Comissão organizadora' },
]

// Papéis de comissão escolhidos no dropdown quando a categoria é "Membro".
const PAPEIS_COMISSAO = [
    { valor: 'MEMBRO',             rotulo: 'Membro' },
    { valor: 'DIRETOR_SITE',       rotulo: 'Diretor(a) de Site' },
    { valor: 'DIRETOR_CONTEUDO',   rotulo: 'Diretor(a) de Conteúdo' },
    { valor: 'DIRETOR_PATROCINIO', rotulo: 'Diretor(a) de Patrocínio' },
    { valor: 'DIRETOR_APOIO',      rotulo: 'Diretor(a) de Apoio' },
    { valor: 'PRESIDENTE',         rotulo: 'Presidente' },
]

// Monta o texto da camiseta: "Normal - M". Retorna '—' se não houver pedido.
function textoCamiseta(camiseta) {
    if (!camiseta) return '—'
    return `${ROTULO_MODELO[camiseta.modelo] ?? camiseta.modelo} - ${camiseta.tamanho}`
}

// Linha individual da tabela para um participante.
function LinhaParticipante({ participante, aoAbrirConfirmacao }) {
    const confirmado = participante.role === 'PARTICIPANTE'

    return (
        <tr>
            <td class="celulaNomeEmailAdmin">
                <span class="nomeParticipanteAdmin">{participante.nome}</span>
                <span class="emailParticipanteAdmin">{participante.email}</span>
            </td>
            <td class="celulaRaAdmin">{participante.ra ?? '—'}</td>
            <td>
                <span class={`badgeContaAdmin ${participante.ativo ? 'badgeContaAtivoAdmin' : 'badgeContaInativoAdmin'}`}>
                    {participante.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="celulaCamisetaAdmin">{textoCamiseta(participante.camiseta)}</td>
            <td class="celulaIngressoParticipantesAdmin">{participante.tipoInscricao?.nome ?? '—'}</td>
            <td class="celulaNivelParticipantesAdmin">
                {participante.nivel ? `${participante.nivel.nome} (${participante.xp ?? 0} xp)` : '—'}
            </td>
            <td class="celulaAcaoParticipantesAdmin">
                {confirmado ? (
                    <div class="grupoAcaoConfirmadoAdmin">
                        <span class="badgeConfirmadoParticipantesAdmin">Confirmado</span>
                        <button
                            type="button"
                            class="botaoAcaoLinhaFinancas"
                            aria-label={`Alterar ${participante.nome}`}
                            title="Alterar"
                            onClick={() => aoAbrirConfirmacao(participante)}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        class="botaoConfirmarParticipanteAdmin"
                        onClick={() => aoAbrirConfirmacao(participante)}
                    >
                        Confirmar
                    </button>
                )}
            </td>
        </tr>
    )
}

export default function TabelaParticipantes({ participantes, aoConfirmar }) {
    const [busca, setBusca] = useState('')
    const [participanteEmConfirmacao, setParticipanteEmConfirmacao] = useState(null)

    const filtrados = useMemo(() =>
        participantes.filter(participante =>
            participante.nome.toLowerCase().includes(busca.toLowerCase()) ||
            participante.email.toLowerCase().includes(busca.toLowerCase())
        ),
        [participantes, busca]
    )

    return (
        <div class="conteinerTabelaAdmin">
            <div class="topoTabelaAdmin">
                <h2 class="tituloTabelaAdmin">Participantes</h2>
                <input
                    class="inputBuscaAdmin"
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={busca}
                    onInput={e => setBusca(e.target.value)}
                />
            </div>

            <div class="scrollTabelaAdmin">
                <table class="tabelaAdmin">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>RA</th>
                            <th>Conta</th>
                            <th>Camiseta</th>
                            <th>Ingresso</th>
                            <th>Nível</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 ? (
                            <tr>
                                <td colSpan={7} class="tabelaVaziaAdmin">
                                    Nenhum participante encontrado.
                                </td>
                            </tr>
                        ) : filtrados.map(participante => (
                            <LinhaParticipante
                                key={participante.id}
                                participante={participante}
                                aoAbrirConfirmacao={setParticipanteEmConfirmacao}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <div class="rodapeTabelaAdmin">
                Exibindo {filtrados.length} de {participantes.length} participantes
            </div>

            {participanteEmConfirmacao && (
                <ModalConfirmarParticipante
                    participante={participanteEmConfirmacao}
                    aoFechar={() => setParticipanteEmConfirmacao(null)}
                    aoConfirmado={aoConfirmar}
                />
            )}
        </div>
    )
}

// ── Modal de confirmação ────────────────────────────────────────
// Atribui o papel da pessoa (Participante / Membro). Para Participante,
// há uma 2ª etapa de seleção do ingresso. Ao salvar com sucesso, mostra
// confirmação visual e fecha sozinho, propagando o participante
// atualizado para o Admin pai via aoConfirmado.
function ModalConfirmarParticipante({ participante, aoFechar, aoConfirmado }) {
    const ehPapelComissao = PAPEIS_COMISSAO.some(p => p.valor === participante.role)

    const [etapa, setEtapa] = useState('role') // 'role' | 'ingresso'
    // Categoria: 'PARTICIPANTE' ou 'MEMBRO' (qualquer papel de comissão).
    const [roleSelecionado, setRoleSelecionado] = useState(
        ehPapelComissao ? 'MEMBRO' : 'PARTICIPANTE'
    )
    // Papel específico quando a categoria é "Membro".
    const [papelComissao, setPapelComissao] = useState(
        ehPapelComissao ? participante.role : 'MEMBRO'
    )

    const [ingressos, setIngressos] = useState([])
    const [carregandoIngressos, setCarregandoIngressos] = useState(false)
    const [ingressoSelecionado, setIngressoSelecionado] = useState(
        participante.tipoInscricao?.id ?? null
    )

    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState(null)
    const [sucesso, setSucesso] = useState(false)

    const podeInteragir = !salvando && !sucesso

    // Avança para a etapa de ingresso e carrega os ativos do ano atual.
    function irParaIngresso() {
        setErro(null)
        setEtapa('ingresso')
        setCarregandoIngressos(true)
        listarTiposInscricao(ANO_ATUAL)
            .then(lista => setIngressos(lista.filter(t => t.ativo)))
            .catch(e => setErro(e.message))
            .finally(() => setCarregandoIngressos(false))
    }

    async function salvar() {
        setSalvando(true)
        setErro(null)
        const roleFinal = roleSelecionado === 'PARTICIPANTE' ? 'PARTICIPANTE' : papelComissao
        const tipoId = roleSelecionado === 'PARTICIPANTE' ? ingressoSelecionado : null
        try {
            const atualizado = await atribuirRole(participante.id, roleFinal, tipoId)
            setSucesso(true)
            // Confirmação visual antes de fechar e atualizar a lista.
            setTimeout(() => {
                aoConfirmado(atualizado)
                aoFechar()
            }, 1100)
        } catch (e) {
            setErro(e.message)
            setSalvando(false)
        }
    }

    // Renderizado via portal no body para cobrir a página inteira,
    // escapando do overflow:hidden e do containing block da tabela.
    return createPortal(
        <div class="overlayModalParticipantesAdmin" onClick={podeInteragir ? aoFechar : undefined}>
            <div class="modalConfirmarParticipantesAdmin" onClick={e => e.stopPropagation()}>
                {sucesso ? (
                    <div class="sucessoModalParticipantesAdmin">
                        <span class="iconeSucessoModalParticipantesAdmin">✓</span>
                        <p class="textoSucessoModalParticipantesAdmin">Inscrição confirmada!</p>
                    </div>
                ) : etapa === 'role' ? (
                    <>
                        <h3 class="tituloModalParticipantesAdmin">Confirmar inscrição</h3>
                        <p class="subtituloModalParticipantesAdmin">
                            Defina o papel de <strong>{participante.nome}</strong> no sistema.
                        </p>

                        <div class="opcoesRoleModalParticipantesAdmin">
                            {OPCOES_ROLE.map(opcao => (
                                <button
                                    key={opcao.valor}
                                    type="button"
                                    class={`opcaoRoleModalParticipantesAdmin ${roleSelecionado === opcao.valor ? 'opcaoRoleAtivaModalParticipantesAdmin' : ''}`}
                                    onClick={() => setRoleSelecionado(opcao.valor)}
                                >
                                    <span class="rotuloOpcaoRoleAdmin">{opcao.rotulo}</span>
                                    <span class="descricaoOpcaoRoleAdmin">{opcao.descricao}</span>
                                </button>
                            ))}
                        </div>

                        {roleSelecionado === 'MEMBRO' && (
                            <div class="campoPapelComissaoModalAdmin">
                                <label class="rotuloPapelComissaoModalAdmin" htmlFor="selectPapelComissao">
                                    Papel na comissão
                                </label>
                                <select
                                    id="selectPapelComissao"
                                    class="selectPapelComissaoModalAdmin"
                                    value={papelComissao}
                                    onChange={e => setPapelComissao(e.currentTarget.value)}
                                >
                                    {PAPEIS_COMISSAO.map(papel => (
                                        <option key={papel.valor} value={papel.valor}>
                                            {papel.rotulo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {erro && <p class="avisoErroModalParticipantesAdmin">{erro}</p>}

                        <div class="rodapeModalParticipantesAdmin">
                            <button
                                type="button"
                                class="botaoCancelarModalParticipantesAdmin"
                                onClick={aoFechar}
                            >
                                Cancelar
                            </button>
                            {roleSelecionado === 'PARTICIPANTE' ? (
                                <button
                                    type="button"
                                    class="botaoSalvarModalParticipantesAdmin"
                                    onClick={irParaIngresso}
                                >
                                    Próximo
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    class="botaoSalvarModalParticipantesAdmin"
                                    onClick={salvar}
                                    disabled={salvando}
                                >
                                    {salvando ? 'Salvando...' : 'Salvar'}
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h3 class="tituloModalParticipantesAdmin">Tipo de ingresso</h3>
                        <p class="subtituloModalParticipantesAdmin">
                            Selecione o ingresso de <strong>{participante.nome}</strong> ({ANO_ATUAL}).
                        </p>

                        {carregandoIngressos ? (
                            <p class="estadoCarregandoParticipantesAdmin">Carregando ingressos...</p>
                        ) : ingressos.length === 0 ? (
                            <p class="avisoVazioIngressoModalAdmin">
                                Nenhum ingresso ativo para {ANO_ATUAL}. Cadastre em “Informações SEMAC”.
                            </p>
                        ) : (
                            <div class="opcoesRoleModalParticipantesAdmin">
                                {ingressos.map(tipo => (
                                    <button
                                        key={tipo.id}
                                        type="button"
                                        class={`opcaoRoleModalParticipantesAdmin ${ingressoSelecionado === tipo.id ? 'opcaoRoleAtivaModalParticipantesAdmin' : ''}`}
                                        onClick={() => setIngressoSelecionado(tipo.id)}
                                    >
                                        <span class="rotuloOpcaoRoleAdmin">{tipo.nome}</span>
                                        <span class="descricaoOpcaoRoleAdmin">{formatarCentavos(tipo.valor)}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {erro && <p class="avisoErroModalParticipantesAdmin">{erro}</p>}

                        <div class="rodapeModalParticipantesAdmin">
                            <button
                                type="button"
                                class="botaoCancelarModalParticipantesAdmin"
                                onClick={() => { setErro(null); setEtapa('role') }}
                                disabled={salvando}
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                class="botaoSalvarModalParticipantesAdmin"
                                onClick={salvar}
                                disabled={salvando || ingressoSelecionado == null}
                            >
                                {salvando ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    )
}
