// Tabela de participantes com busca em tempo real por nome ou e-mail.
//
// Cada linha exibe: nome (com e-mail abaixo), RA, status da conta,
// o ingresso, o nível e a ação de confirmação.
// A filtragem é feita no cliente — quando houver muitos participantes,
// considerar mover para query params na API (?busca=...).
//
// O botão "Adicionar participante" no topo abre o cadastro manual
// (ModalAdicionarParticipante), para quem se inscreveu no balcão e não
// passou pelo formulário público.
//
// Props:
//   participantes — array completo de participantes vindo do Admin pai
//   aoConfirmar   — (pessoaAtualizada) => void, chamado após confirmar,
//                   desconfirmar ou cadastrar manualmente
//   aoExcluir     — (id) => void, chamado após excluir definitivamente

import { useState, useMemo, useEffect } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { atribuirRole, desconfirmarParticipante, excluirParticipante, buscarComprovante } from './data/apiParticipantes.js'
import { listarTiposInscricao } from './data/apiTipoInscricao.js'
import { formatarCentavos } from '../Financas/utils/moeda.js'
import { temAcessoDiretoria, temAcessoGestaoParticipantes } from '../../auth/sessao.js'
import ModalConquistasParticipante from './ModalConquistasParticipante.jsx'
import ModalAdicionarParticipante from './ModalAdicionarParticipante.jsx'
import ModalEditarParticipante from './ModalEditarParticipante.jsx'
import ListaItensMobileAdmin from '../../components/ListaItensMobileAdmin/ListaItensMobileAdmin.jsx'
import ModalInferiorAdmin from '../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx'

const ANO_ATUAL = new Date().getFullYear()

// Categorias de papel oferecidas na confirmação da inscrição.
const OPCOES_ROLE = [
    { valor: 'PARTICIPANTE', rotulo: 'Participante', descricao: 'Inscrito no evento' },
    { valor: 'MEMBRO',       rotulo: 'Membro',       descricao: 'Comissão organizadora' },
]

// Status cru devolvido pela Mercado Pago, traduzido pra exibição no modal.
const ROTULO_STATUS_CARTAO = {
    approved: 'Aprovado',
    rejected: 'Recusado',
    pending: 'Em análise',
    in_process: 'Em análise',
    in_mediation: 'Em mediação',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    charged_back: 'Estornado (chargeback)',
}

// Valor do pagamento no cartão já vem em reais (BigDecimal do backend) —
// não usar formatarCentavos (feita pra campos em centavos) aqui.
function formatarReais(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// inscritoEm vem null para cadastros anteriores à coluna (V22).
function formatarDataInscricao(inscritoEm) {
    if (!inscritoEm) return 'Data de inscrição não registrada'
    const dataInscricao = new Date(inscritoEm)
    const dia = dataInscricao.toLocaleDateString('pt-BR')
    const hora = dataInscricao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return `Inscrito em ${dia} às ${hora}`
}

// Papéis de comissão escolhidos no dropdown quando a categoria é "Membro".
const PAPEIS_COMISSAO = [
    { valor: 'MEMBRO',             rotulo: 'Membro' },
    { valor: 'DIRETOR_SITE',       rotulo: 'Diretor(a) de Site' },
    { valor: 'DIRETOR_CONTEUDO',   rotulo: 'Diretor(a) de Conteúdo' },
    { valor: 'DIRETOR_PATROCINIO', rotulo: 'Diretor(a) de Patrocínio' },
    { valor: 'DIRETOR_APOIO',      rotulo: 'Diretor(a) de Apoio' },
    { valor: 'DIRETOR_MARKETING',  rotulo: 'Diretor(a) de Marketing' },
    { valor: 'PRESIDENTE',         rotulo: 'Presidente' },
]


// Dias escolhidos pelo diarista, no formato do backend ('SEG 26/10'),
// separados por ' · '. null para quem não tem ingresso de diária. Se
// ainda faltam dias a escolher, avisa quantos; `dias` nulo vale como uma
// diária, mesma regra do backend (DiaIngressoService.diasContratados).
const ROTULOS_DIA_SEMANA_INGRESSO = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

function textoDiasIngresso(participante) {
    if (!participante.tipoInscricao?.porDia) return null
    const diasContratados = participante.dias >= 1 ? participante.dias : 1
    const diasEscolhidos = (participante.diasIngresso ?? []).map(dataIso => {
        const [ano, mes, dia] = dataIso.split('-').map(Number)
        const diaSemana = ROTULOS_DIA_SEMANA_INGRESSO[new Date(ano, mes - 1, dia).getDay()]
        return `${diaSemana} ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
    })

    if (diasEscolhidos.length === 0) {
        return `Ainda não escolheu (${diasContratados} ${diasContratados === 1 ? 'diária' : 'diárias'})`
    }
    const faltam = diasContratados - diasEscolhidos.length
    return faltam > 0
        ? `${diasEscolhidos.join(' · ')} (falta escolher ${faltam})`
        : diasEscolhidos.join(' · ')
}

// Formata o telefone salvo (só dígitos) para exibição: (00) 00000-0000
// (celular) ou (00) 0000-0000 (fixo). '—' se não houver telefone.
function textoTelefone(telefone) {
    if (!telefone) return '—'
    const digitos = telefone.replace(/\D/g, '')
    if (digitos.length === 11) return digitos.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    if (digitos.length === 10) return digitos.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    return telefone
}

// Linha individual da tabela para um participante.
function LinhaParticipante({
    participante, aoAbrirConfirmacao, aoExcluir, confirmandoExcluir, processandoExcluir,
    aoDesconfirmar, confirmandoDesconfirmar, processandoDesconfirmar,
    podeVerConquistas, aoVerConquistas,
    podeEditarParticipante, aoEditarParticipante,
}) {
    const confirmado = participante.role === 'PARTICIPANTE'
    const diasIngresso = textoDiasIngresso(participante)

    return (
        <tr>
            <td class="celulaNomeEmailAdmin">
                <span class="nomeParticipanteAdmin">{participante.nome}</span>
                <span class="emailParticipanteAdmin">{participante.email}</span>
            </td>
            <td class="celulaRaAdmin">{participante.ra ?? '—'}</td>
            <td class="celulaTelefoneAdmin">{textoTelefone(participante.telefone)}</td>
            <td>
                <span class={`badgeContaAdmin ${participante.ativo ? 'badgeContaAtivoAdmin' : 'badgeContaInativoAdmin'}`}>
                    {participante.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="celulaIngressoParticipantesAdmin">
                {participante.tipoInscricao?.nome ?? '—'}
                {diasIngresso && <span class="diasIngressoParticipantesAdmin">{diasIngresso}</span>}
            </td>
            <td class="celulaNivelParticipantesAdmin">
                {participante.nivel ? `${participante.nivel.nome} (${participante.xp ?? 0} xp)` : '—'}
            </td>
            <td class="celulaAcaoParticipantesAdmin">
                <div class="grupoAcoesLinhaFinancas">
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
                            <button
                                type="button"
                                class={`botaoAcaoLinhaFinancas ${confirmandoDesconfirmar ? 'botaoConfirmarExclusaoFinancas' : ''}`}
                                disabled={processandoDesconfirmar}
                                aria-label={
                                    confirmandoDesconfirmar
                                        ? `Confirmar desconfirmação de ${participante.nome}`
                                        : `Desconfirmar ${participante.nome}`
                                }
                                title={confirmandoDesconfirmar ? 'Clique novamente para confirmar' : 'Desconfirmar (volta para aguardando)'}
                                onClick={() => aoDesconfirmar(participante)}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            class="botaoAcaoLinhaFinancas botaoConfirmarLinhaParticipantesAdmin"
                            aria-label={`Confirmar inscrição de ${participante.nome}`}
                            title="Confirmar"
                            onClick={() => aoAbrirConfirmacao(participante)}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </button>
                    )}
                    {podeEditarParticipante && (
                        <button
                            type="button"
                            class="botaoAcaoLinhaFinancas"
                            aria-label={`Editar dados e minicursos de ${participante.nome}`}
                            title="Editar dados e minicursos"
                            onClick={() => aoEditarParticipante(participante)}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11.5 15H7a4 4 0 0 0-4 4v2" />
                            <path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
                            <circle cx="10" cy="7" r="4" />
                        </svg>
                        </button>
                    )}
                    {podeVerConquistas && confirmado && (
                        <button
                            type="button"
                            class="botaoAcaoLinhaFinancas"
                            aria-label={`Ver conquistas de ${participante.nome}`}
                            title="Conquistas"
                            onClick={() => aoVerConquistas(participante)}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="8" r="6" />
                                <path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11" />
                            </svg>
                        </button>
                    )}
                    <button
                        type="button"
                        class={`botaoAcaoLinhaFinancas ${confirmandoExcluir ? 'botaoConfirmarExclusaoFinancas' : ''}`}
                        disabled={processandoExcluir}
                        aria-label={
                            confirmandoExcluir
                                ? `Confirmar exclusão de ${participante.nome}`
                                : `Excluir ${participante.nome}`
                        }
                        title={confirmandoExcluir ? 'Clique novamente para confirmar' : 'Excluir'}
                        onClick={() => aoExcluir(participante)}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    )
}

export default function TabelaParticipantes({ participantes, aoConfirmar, aoExcluir }) {
    const [busca, setBusca] = useState('')
    const [ordenarPorDataInscricao, setOrdenarPorDataInscricao] = useState(false)
    const [participanteEmConfirmacao, setParticipanteEmConfirmacao] = useState(null)
    const [participanteVendoConquistas, setParticipanteVendoConquistas] = useState(null)
    const [cadastroManualAberto, setCadastroManualAberto] = useState(false)
    const [idConfirmandoExcluir, setIdConfirmandoExcluir] = useState(null)
    const [idProcessandoExcluir, setIdProcessandoExcluir] = useState(null)
    const [erroExclusao, setErroExclusao] = useState('')
    const [idConfirmandoDesconfirmar, setIdConfirmandoDesconfirmar] = useState(null)
    const [idProcessandoDesconfirmar, setIdProcessandoDesconfirmar] = useState(null)
    const [erroDesconfirmar, setErroDesconfirmar] = useState('')
    /* Ver e revogar conquista fica com diretores e presidência — revogar
       mexe no xp e no ranking (ver SecurityConfig). */
    const podeVerConquistas = temAcessoDiretoria()
    /* Corrigir cadastro e mexer em minicurso de outra pessoa fica com a
       diretoria de site e a presidência (ver SecurityConfig). */
    const podeEditarParticipante = temAcessoGestaoParticipantes()
    const [participanteEmEdicao, setParticipanteEmEdicao] = useState(null)
    /* Mobile: participante aberto no modal de detalhes. Guarda só o id e
       busca na lista a cada render, para o modal refletir na hora uma
       desconfirmação e sumir sozinho depois de uma exclusão. */
    const [idParticipanteDetalhado, setIdParticipanteDetalhado] = useState(null)
    const participanteDetalhado = participantes.find(p => p.id === idParticipanteDetalhado) ?? null

    // Fechar o modal descarta um "toque de novo para confirmar" pendente.
    function fecharDetalhesParticipante() {
        setIdParticipanteDetalhado(null)
        setIdConfirmandoExcluir(null)
        setIdConfirmandoDesconfirmar(null)
    }

    // Com o switch desligado, ordem alfabética (padrão). Ligado, mais
    // recentes primeiro por inscritoEm — cadastros antigos sem essa data
    // (anteriores à coluna) vão para o final, nos dois casos.
    const filtrados = useMemo(() => {
        const resultado = participantes.filter(participante =>
            participante.nome.toLowerCase().includes(busca.toLowerCase()) ||
            participante.email.toLowerCase().includes(busca.toLowerCase())
        )
        return ordenarPorDataInscricao
            ? resultado.sort((a, b) => {
                if (!a.inscritoEm) return 1
                if (!b.inscritoEm) return -1
                return new Date(b.inscritoEm) - new Date(a.inscritoEm)
            })
            : resultado.sort((a, b) => a.nome.localeCompare(b.nome))
    }, [participantes, busca, ordenarPorDataInscricao])

    // Exclusão definitiva: exige 2 cliques. O backend recusa (409) quem
    // organizou sorteios ou mexeu no caixa do Fundunesp.
    async function excluir(participante) {
        if (idConfirmandoExcluir !== participante.id) {
            setIdConfirmandoExcluir(participante.id)
            return
        }
        setErroExclusao('')
        setIdProcessandoExcluir(participante.id)
        try {
            await excluirParticipante(participante.id)
            aoExcluir(participante.id)
        } catch (e) {
            setErroExclusao(e.message)
        } finally {
            setIdProcessandoExcluir(null)
            setIdConfirmandoExcluir(null)
        }
    }

    // Desconfirmação: exige 2 cliques, mesmo padrão da exclusão. O backend
    // recusa (409) quem já tem presença registrada em algum evento.
    async function desconfirmar(participante) {
        if (idConfirmandoDesconfirmar !== participante.id) {
            setIdConfirmandoDesconfirmar(participante.id)
            return
        }
        setErroDesconfirmar('')
        setIdProcessandoDesconfirmar(participante.id)
        try {
            const atualizado = await desconfirmarParticipante(participante.id)
            aoConfirmar(atualizado)
        } catch (e) {
            setErroDesconfirmar(e.message)
        } finally {
            setIdProcessandoDesconfirmar(null)
            setIdConfirmandoDesconfirmar(null)
        }
    }

    return (
        <div class="conteinerTabelaAdmin">
            <div class="topoTabelaAdmin">
                <h2 class="tituloTabelaAdmin">Participantes</h2>
                <div class="controlesTabelaAdmin">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={ordenarPorDataInscricao}
                        class={`switchOrdenacaoTabelaAdmin ${ordenarPorDataInscricao ? 'switchOrdenacaoAtivoTabelaAdmin' : ''}`}
                        onClick={() => setOrdenarPorDataInscricao(anterior => !anterior)}
                    >
                        <span class="trilhoSwitchOrdenacaoTabelaAdmin">
                            <span class="bolinhaSwitchOrdenacaoTabelaAdmin" />
                        </span>
                        <span class="rotuloSwitchOrdenacaoTabelaAdmin">Ordenar por data de inscrição</span>
                    </button>
                    <input
                        class="inputBuscaAdmin"
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={busca}
                        onInput={e => setBusca(e.target.value)}
                    />
                    <button
                        type="button"
                        class="botaoAbrirCadastroParticipantesAdmin"
                        onClick={() => setCadastroManualAberto(true)}
                    >
                        + Adicionar participante
                    </button>
                </div>
            </div>

            {erroExclusao && <p class="avisoErroModalParticipantesAdmin">{erroExclusao}</p>}
            {erroDesconfirmar && <p class="avisoErroModalParticipantesAdmin">{erroDesconfirmar}</p>}

            {/* Mobile: só os nomes; o toque abre o modal de detalhes. */}
            <ListaItensMobileAdmin
                itens={filtrados}
                textoVazio="Nenhum participante encontrado."
                aoSelecionar={participante => {
                    setErroExclusao('')
                    setErroDesconfirmar('')
                    setIdParticipanteDetalhado(participante.id)
                }}
            />

            <div class="scrollTabelaAdmin tabelaOcultaMobileAdmin">
                <table class="tabelaAdmin">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>RA</th>
                            <th>Telefone</th>
                            <th>Conta</th>
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
                                aoExcluir={excluir}
                                confirmandoExcluir={idConfirmandoExcluir === participante.id}
                                processandoExcluir={idProcessandoExcluir === participante.id}
                                aoDesconfirmar={desconfirmar}
                                confirmandoDesconfirmar={idConfirmandoDesconfirmar === participante.id}
                                processandoDesconfirmar={idProcessandoDesconfirmar === participante.id}
                                podeVerConquistas={podeVerConquistas}
                                aoVerConquistas={setParticipanteVendoConquistas}
                                podeEditarParticipante={podeEditarParticipante}
                                aoEditarParticipante={setParticipanteEmEdicao}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <div class="rodapeTabelaAdmin">
                Exibindo {filtrados.length} de {participantes.length} participantes
            </div>

            {participanteDetalhado && (
                <ModalDetalhesParticipante
                    participante={participanteDetalhado}
                    aoFechar={fecharDetalhesParticipante}
                    erro={erroExclusao || erroDesconfirmar}
                    podeVerConquistas={podeVerConquistas}
                    podeEditarParticipante={podeEditarParticipante}
                    aoAbrirConfirmacao={setParticipanteEmConfirmacao}
                    aoEditarParticipante={setParticipanteEmEdicao}
                    aoVerConquistas={setParticipanteVendoConquistas}
                    aoDesconfirmar={desconfirmar}
                    confirmandoDesconfirmar={idConfirmandoDesconfirmar === participanteDetalhado.id}
                    processandoDesconfirmar={idProcessandoDesconfirmar === participanteDetalhado.id}
                    aoExcluir={excluir}
                    confirmandoExcluir={idConfirmandoExcluir === participanteDetalhado.id}
                    processandoExcluir={idProcessandoExcluir === participanteDetalhado.id}
                />
            )}

            {cadastroManualAberto && (
                <ModalAdicionarParticipante
                    aoFechar={() => setCadastroManualAberto(false)}
                    aoCriado={aoConfirmar}
                />
            )}

            {participanteEmEdicao && (
                <ModalEditarParticipante
                    pessoa={participanteEmEdicao}
                    aoFechar={() => setParticipanteEmEdicao(null)}
                    aoAtualizado={aoConfirmar}
                />
            )}

            {participanteVendoConquistas && (
                <ModalConquistasParticipante
                    participante={participanteVendoConquistas}
                    aoFechar={() => setParticipanteVendoConquistas(null)}
                />
            )}

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

// ── Modal de detalhes (mobile) ──────────────────────────────────
// No mobile a tabela vira uma lista de nomes; este modal mostra o resto
// das colunas e as mesmas ações, agora com texto em vez de só ícone.
// As ações que abrem outro modal fecham este antes, para não empilhar.
function ModalDetalhesParticipante({
    participante, aoFechar, erro,
    podeVerConquistas, podeEditarParticipante,
    aoAbrirConfirmacao, aoEditarParticipante, aoVerConquistas,
    aoDesconfirmar, confirmandoDesconfirmar, processandoDesconfirmar,
    aoExcluir, confirmandoExcluir, processandoExcluir,
}) {
    const confirmado = participante.role === 'PARTICIPANTE'
    const digitosTelefone = participante.telefone?.replace(/\D/g, '')
    const diasIngresso = textoDiasIngresso(participante)

    return (
        <ModalInferiorAdmin titulo={participante.nome} subtitulo={participante.email} aoFechar={aoFechar}>
            {fecharDetalhes => (
                <>
                    <dl class="listaDetalhesItemModalInferiorAdmin">
                        <div class="linhaDetalheItemModalInferiorAdmin">
                            <dt class="rotuloDetalheItemModalInferiorAdmin">Inscrição</dt>
                            <dd class="valorDetalheItemModalInferiorAdmin">
                                {confirmado
                                    ? <span class="badgeConfirmadoParticipantesAdmin">Confirmado</span>
                                    : 'Aguardando confirmação'}
                            </dd>
                        </div>
                        <div class="linhaDetalheItemModalInferiorAdmin">
                            <dt class="rotuloDetalheItemModalInferiorAdmin">RA</dt>
                            <dd class="valorDetalheItemModalInferiorAdmin">{participante.ra ?? '—'}</dd>
                        </div>
                        <div class="linhaDetalheItemModalInferiorAdmin">
                            <dt class="rotuloDetalheItemModalInferiorAdmin">Telefone</dt>
                            <dd class="valorDetalheItemModalInferiorAdmin">
                                {digitosTelefone
                                    ? <a class="linkTelefoneItemModalInferiorAdmin" href={`tel:${digitosTelefone}`}>{textoTelefone(participante.telefone)}</a>
                                    : '—'}
                            </dd>
                        </div>
                        <div class="linhaDetalheItemModalInferiorAdmin">
                            <dt class="rotuloDetalheItemModalInferiorAdmin">Conta</dt>
                            <dd class="valorDetalheItemModalInferiorAdmin">
                                <span class={`badgeContaAdmin ${participante.ativo ? 'badgeContaAtivoAdmin' : 'badgeContaInativoAdmin'}`}>
                                    {participante.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </dd>
                        </div>
                        <div class="linhaDetalheItemModalInferiorAdmin">
                            <dt class="rotuloDetalheItemModalInferiorAdmin">Ingresso</dt>
                            <dd class="valorDetalheItemModalInferiorAdmin">{participante.tipoInscricao?.nome ?? '—'}</dd>
                        </div>
                        {diasIngresso && (
                            <div class="linhaDetalheItemModalInferiorAdmin">
                                <dt class="rotuloDetalheItemModalInferiorAdmin">Dias escolhidos</dt>
                                <dd class="valorDetalheItemModalInferiorAdmin">{diasIngresso}</dd>
                            </div>
                        )}
                        <div class="linhaDetalheItemModalInferiorAdmin">
                            <dt class="rotuloDetalheItemModalInferiorAdmin">Nível</dt>
                            <dd class="valorDetalheItemModalInferiorAdmin">
                                {participante.nivel ? `${participante.nivel.nome} (${participante.xp ?? 0} xp)` : '—'}
                            </dd>
                        </div>
                    </dl>
                    <p class="notaItemModalInferiorAdmin">{formatarDataInscricao(participante.inscritoEm)}</p>

                    {erro && <p class="avisoErroModalParticipantesAdmin">{erro}</p>}

                    <div class="grupoAcoesItemModalInferiorAdmin">
                        <button
                            type="button"
                            class="botaoAcaoItemModalInferiorAdmin botaoAcaoPrincipalItemModalInferiorAdmin"
                            onClick={() => fecharDetalhes(() => aoAbrirConfirmacao(participante))}
                        >
                            {confirmado ? 'Alterar papel e ingresso' : 'Confirmar inscrição'}
                        </button>
                        {podeEditarParticipante && (
                            <button
                                type="button"
                                class="botaoAcaoItemModalInferiorAdmin"
                                onClick={() => fecharDetalhes(() => aoEditarParticipante(participante))}
                            >
                                Editar dados e minicursos
                            </button>
                        )}
                        {podeVerConquistas && confirmado && (
                            <button
                                type="button"
                                class="botaoAcaoItemModalInferiorAdmin"
                                onClick={() => fecharDetalhes(() => aoVerConquistas(participante))}
                            >
                                Conquistas
                            </button>
                        )}

                        <div class="linhaAcoesDestrutivasItemModalInferiorAdmin">
                            {confirmado && (
                                <button
                                    type="button"
                                    class={`botaoAcaoItemModalInferiorAdmin botaoAcaoPerigoItemModalInferiorAdmin ${confirmandoDesconfirmar ? 'botaoAcaoConfirmandoItemModalInferiorAdmin' : ''}`}
                                    disabled={processandoDesconfirmar}
                                    onClick={() => aoDesconfirmar(participante)}
                                >
                                    {processandoDesconfirmar
                                        ? 'Desconfirmando...'
                                        : confirmandoDesconfirmar ? 'Toque de novo para desconfirmar' : 'Desconfirmar'}
                                </button>
                            )}
                            <button
                                type="button"
                                class={`botaoAcaoItemModalInferiorAdmin botaoAcaoPerigoItemModalInferiorAdmin ${confirmandoExcluir ? 'botaoAcaoConfirmandoItemModalInferiorAdmin' : ''}`}
                                disabled={processandoExcluir}
                                onClick={() => aoExcluir(participante)}
                            >
                                {processandoExcluir
                                    ? 'Excluindo...'
                                    : confirmandoExcluir ? 'Toque de novo para excluir' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </ModalInferiorAdmin>
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

    // Comprovante de pagamento anexado no cadastro — baixado como blob (a
    // rota exige o Bearer token, então não dá pra usar direto num <img src>)
    // e virado num object URL local pro preview inline.
    const [comprovanteUrl, setComprovanteUrl] = useState(null)
    const [comprovanteTipo, setComprovanteTipo] = useState(null)
    const [carregandoComprovante, setCarregandoComprovante] = useState(false)
    const [erroComprovante, setErroComprovante] = useState(null)

    useEffect(() => {
        if (!participante.temComprovante) return
        let ativo = true
        let urlCriada = null
        setCarregandoComprovante(true)
        setErroComprovante(null)
        buscarComprovante(participante.id)
            .then(blob => {
                if (!ativo) return
                urlCriada = URL.createObjectURL(blob)
                setComprovanteUrl(urlCriada)
                setComprovanteTipo(blob.type)
            })
            .catch(e => { if (ativo) setErroComprovante(e.message) })
            .finally(() => { if (ativo) setCarregandoComprovante(false) })
        return () => {
            ativo = false
            if (urlCriada) URL.revokeObjectURL(urlCriada)
        }
    }, [participante.id, participante.temComprovante])

    // Avança para a etapa de ingresso e carrega todos os do ano atual —
    // inclusive os inativos: o ingresso escolhido na inscrição pode ter
    // sido desativado depois. Ativos vêm primeiro.
    function irParaIngresso() {
        setErro(null)
        setEtapa('ingresso')
        setCarregandoIngressos(true)
        listarTiposInscricao(ANO_ATUAL)
            .then(lista => setIngressos([...lista].sort((a, b) => Number(!!b.ativo) - Number(!!a.ativo))))
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
            <div class="modalConfirmarParticipantesAdmin modalConfirmarComComprovanteAdmin" onClick={e => e.stopPropagation()}>
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
                            <span class="textoDataInscricaoModalAdmin">
                                {formatarDataInscricao(participante.inscritoEm)}
                            </span>
                        </p>

                        {participante.formaPagamento === 'CARTAO' ? (
                            <div class="blocoPagamentoCartaoModalAdmin">
                                <span class="rotuloPagamentoCartaoModalAdmin">Pagamento por cartão</span>
                                <span class={`badgeStatusCartaoModalAdmin badgeStatusCartao${
                                    participante.pagamentoCartao.status === 'approved' ? 'Aprovado' : 'Pendente'
                                }ModalAdmin`}>
                                    {ROTULO_STATUS_CARTAO[participante.pagamentoCartao.status] ?? participante.pagamentoCartao.status}
                                </span>
                                <span class="detalhePagamentoCartaoModalAdmin">
                                    {participante.pagamentoCartao.parcelas}x — {formatarReais(participante.pagamentoCartao.valorCobrado)}
                                </span>
                                <span class="detalhePagamentoCartaoModalAdmin">
                                    ID Mercado Pago: {participante.pagamentoCartao.mpPaymentId}
                                </span>
                                {participante.pagamentoCartao.statusDetail && (
                                    <span class="detalheStatusCartaoModalAdmin">{participante.pagamentoCartao.statusDetail}</span>
                                )}
                            </div>
                        ) : participante.temComprovante ? (
                            <div class="blocoComprovanteModalAdmin">
                                <span class="rotuloComprovanteModalAdmin">Comprovante de pagamento</span>
                                {carregandoComprovante && (
                                    <p class="estadoCarregandoParticipantesAdmin">Carregando comprovante...</p>
                                )}
                                {erroComprovante && <p class="avisoErroModalParticipantesAdmin">{erroComprovante}</p>}
                                {comprovanteUrl && comprovanteTipo?.startsWith('image/') && (
                                    <img
                                        src={comprovanteUrl}
                                        class="previewComprovanteModalAdmin"
                                        alt={`Comprovante de pagamento de ${participante.nome}`}
                                    />
                                )}
                                {comprovanteUrl && comprovanteTipo === 'application/pdf' && (
                                    <iframe
                                        src={comprovanteUrl}
                                        class="previewComprovantePdfModalAdmin"
                                        title={`Comprovante de pagamento de ${participante.nome}`}
                                    />
                                )}
                                {comprovanteUrl && (
                                    <a
                                        href={comprovanteUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        class="linkAbrirComprovanteModalAdmin"
                                    >
                                        Abrir em nova aba
                                    </a>
                                )}
                            </div>
                        ) : (
                            <p class="avisoSemComprovanteModalAdmin">Nenhum comprovante de pagamento anexado.</p>
                        )}

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
                                Nenhum ingresso cadastrado para {ANO_ATUAL}. Cadastre em “Informações SEMAC”.
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
                                        <span class="rotuloOpcaoRoleAdmin">
                                            {tipo.nome}
                                            {!tipo.ativo && (
                                                <span class="spanSeloInativoIngressoModalAdmin">Inativo</span>
                                            )}
                                        </span>
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
