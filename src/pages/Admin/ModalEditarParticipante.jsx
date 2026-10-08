// Edição de uma pessoa pela diretoria (Diretor de Site e Presidência),
// aberta pelo botão "Editar dados e minicursos" das tabelas de
// Participantes e de Comissão do /admin.
//
// Duas partes:
//   - Dados: nome, e-mail, RA e telefone (PATCH /api/pessoa/{id}/dados).
//     CPF fica de fora — é o identificador da pessoa. O e-mail é o login:
//     trocar aqui troca com que e-mail ela entra.
//   - Minicursos (só participante confirmado): tirar de um minicurso e
//     colocar em outro, sem as travas de prazo do participante, mas
//     respeitando vagas, choque de horário e dia do ingresso diário (ver
//     InscricaoEventoService.inscreverPelaDiretoria).
//
// Props:
//   pessoa       — a linha da tabela (ParticipanteResponseDTO)
//   aoFechar     — () => void
//   aoAtualizado — (pessoaAtualizada) => void, após salvar os dados

import { useState, useEffect } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import {
    atualizarDadosPessoa,
    listarMinicursosDoParticipante,
    listarTodosMinicursos,
    adicionarParticipanteMinicurso,
    removerParticipanteMinicurso,
} from './data/apiParticipantes.js'
import './modalAdicionarParticipante.css'
import './modalEditarParticipante.css'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Máscara de telefone: (00) 00000-0000 (celular) ou (00) 0000-0000 (fixo).
function mascaraTelefone(valor) {
    const digitos = (valor ?? '').replace(/\D/g, '').slice(0, 11)
    if (digitos.length <= 10) {
        return digitos
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return digitos
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
}

// '2026-10-13T14:00:00' → 'Ter 13/10 · 14:00–16:00'
function textoHorarioMinicurso(evento) {
    const [data, horaInicio = ''] = evento.dataHoraInicio.split('T')
    const horaFim = (evento.dataHoraFim ?? '').split('T')[1] ?? ''
    const [ano, mes, dia] = data.split('-').map(Number)
    const diaSemana = DIAS_SEMANA[new Date(ano, mes - 1, dia).getDay()]
    const fim = horaFim ? `–${horaFim.slice(0, 5)}` : ''
    return `${diaSemana} ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')} · ${horaInicio.slice(0, 5)}${fim}`
}

const ROTULO_STATUS_MINICURSO = {
    INSCRITO: 'Inscrito',
    PRESENTE: 'Presente',
    AUSENTE: 'Ausente',
}

export default function ModalEditarParticipante({ pessoa, aoFechar, aoAtualizado }) {
    const ehParticipanteConfirmado = pessoa.role === 'PARTICIPANTE'

    const [formularioDados, setFormularioDados] = useState({
        nome: pessoa.nome ?? '',
        email: pessoa.email ?? '',
        ra: pessoa.ra ?? '',
        telefone: mascaraTelefone(pessoa.telefone),
    })
    const [salvandoDados, setSalvandoDados] = useState(false)
    const [erroDados, setErroDados] = useState('')
    const [avisoDadosSalvos, setAvisoDadosSalvos] = useState(false)

    const [minicursosInscritos, setMinicursosInscritos] = useState([])
    const [todosMinicursos, setTodosMinicursos] = useState([])
    const [carregandoMinicursos, setCarregandoMinicursos] = useState(ehParticipanteConfirmado)
    const [erroMinicursos, setErroMinicursos] = useState('')
    const [minicursoSelecionadoId, setMinicursoSelecionadoId] = useState('')
    const [adicionandoMinicurso, setAdicionandoMinicurso] = useState(false)
    const [idConfirmandoRemoverMinicurso, setIdConfirmandoRemoverMinicurso] = useState(null)
    const [idRemovendoMinicurso, setIdRemovendoMinicurso] = useState(null)

    // Recarrega as duas listas juntas: entrar ou sair de um minicurso muda
    // também as vagas restantes mostradas no select.
    async function carregarMinicursos() {
        try {
            const [inscritos, todos] = await Promise.all([
                listarMinicursosDoParticipante(pessoa.id),
                listarTodosMinicursos(),
            ])
            setMinicursosInscritos(inscritos)
            setTodosMinicursos(todos)
        } catch (e) {
            setErroMinicursos(e.message)
        } finally {
            setCarregandoMinicursos(false)
        }
    }

    useEffect(() => {
        if (ehParticipanteConfirmado) carregarMinicursos()
    }, [pessoa.id])

    function atualizarCampoDados(campo, valor) {
        setAvisoDadosSalvos(false)
        setFormularioDados(anterior => ({ ...anterior, [campo]: valor }))
    }

    const digitosTelefone = formularioDados.telefone.replace(/\D/g, '')
    const formularioDadosValido = formularioDados.nome.trim()
        && formularioDados.email.trim()
        && digitosTelefone.length >= 10

    async function salvarDados() {
        setSalvandoDados(true)
        setErroDados('')
        try {
            const atualizada = await atualizarDadosPessoa(pessoa.id, {
                nome: formularioDados.nome.trim(),
                email: formularioDados.email.trim(),
                ra: formularioDados.ra.trim() || null,
                telefone: digitosTelefone,
            })
            aoAtualizado(atualizada)
            setAvisoDadosSalvos(true)
        } catch (e) {
            setErroDados(e.message)
        } finally {
            setSalvandoDados(false)
        }
    }

    async function adicionarMinicurso() {
        setErroMinicursos('')
        setAdicionandoMinicurso(true)
        try {
            await adicionarParticipanteMinicurso(pessoa.id, Number(minicursoSelecionadoId))
            setMinicursoSelecionadoId('')
            await carregarMinicursos()
        } catch (e) {
            setErroMinicursos(e.message)
        } finally {
            setAdicionandoMinicurso(false)
        }
    }

    // Remover exige 2 cliques, mesmo padrão da exclusão na tabela.
    async function removerMinicurso(evento) {
        if (idConfirmandoRemoverMinicurso !== evento.id) {
            setIdConfirmandoRemoverMinicurso(evento.id)
            return
        }
        setErroMinicursos('')
        setIdRemovendoMinicurso(evento.id)
        try {
            await removerParticipanteMinicurso(pessoa.id, evento.id)
            await carregarMinicursos()
        } catch (e) {
            setErroMinicursos(e.message)
        } finally {
            setIdRemovendoMinicurso(null)
            setIdConfirmandoRemoverMinicurso(null)
        }
    }

    const idsMinicursosInscritos = new Set(minicursosInscritos.map(item => item.evento.id))
    const minicursosDisponiveis = todosMinicursos
        .filter(evento => !idsMinicursosInscritos.has(evento.id))
        .sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio))
    const minicursosInscritosOrdenados = [...minicursosInscritos]
        .sort((a, b) => a.evento.dataHoraInicio.localeCompare(b.evento.dataHoraInicio))

    const ocupado = salvandoDados || adicionandoMinicurso || idRemovendoMinicurso != null

    return createPortal(
        <div class="overlayModalParticipantesAdmin" onClick={ocupado ? undefined : aoFechar}>
            <div
                class="modalConfirmarParticipantesAdmin modalAdicionarParticipanteAdmin"
                onClick={e => e.stopPropagation()}
            >
                <h3 class="tituloModalParticipantesAdmin">Editar {pessoa.nome}</h3>
                <p class="subtituloModalParticipantesAdmin">
                    O e-mail é o login: se mudar, a pessoa passa a entrar com o novo.
                </p>

                <h4 class="tituloSecaoEditarParticipanteAdmin">Dados</h4>
                <div class="gradeCamposAdicionarParticipanteAdmin">
                    <div class="campoFormularioAdicionarParticipanteAdmin campoLargoAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputNomeEditarParticipante">
                            Nome
                        </label>
                        <input
                            id="inputNomeEditarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="text"
                            value={formularioDados.nome}
                            disabled={salvandoDados}
                            onInput={e => atualizarCampoDados('nome', e.target.value)}
                        />
                    </div>
                    <div class="campoFormularioAdicionarParticipanteAdmin campoLargoAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputEmailEditarParticipante">
                            E-mail
                        </label>
                        <input
                            id="inputEmailEditarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="email"
                            value={formularioDados.email}
                            disabled={salvandoDados}
                            onInput={e => atualizarCampoDados('email', e.target.value)}
                        />
                    </div>
                    <div class="campoFormularioAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputTelefoneEditarParticipante">
                            Telefone
                        </label>
                        <input
                            id="inputTelefoneEditarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="tel"
                            value={formularioDados.telefone}
                            disabled={salvandoDados}
                            onInput={e => atualizarCampoDados('telefone', mascaraTelefone(e.target.value))}
                        />
                    </div>
                    <div class="campoFormularioAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputRaEditarParticipante">
                            RA
                        </label>
                        <input
                            id="inputRaEditarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="text"
                            value={formularioDados.ra}
                            placeholder="Opcional"
                            disabled={salvandoDados}
                            onInput={e => atualizarCampoDados('ra', e.target.value)}
                        />
                    </div>
                </div>

                {erroDados && <p class="avisoErroModalParticipantesAdmin">{erroDados}</p>}
                {avisoDadosSalvos && <p class="avisoSucessoDadosEditarParticipanteAdmin">Dados salvos.</p>}

                <div class="rodapeSecaoDadosEditarParticipanteAdmin">
                    <button
                        type="button"
                        class="botaoSalvarModalParticipantesAdmin"
                        onClick={salvarDados}
                        disabled={salvandoDados || !formularioDadosValido}
                    >
                        {salvandoDados ? 'Salvando...' : 'Salvar dados'}
                    </button>
                </div>

                {ehParticipanteConfirmado && (
                    <>
                        <h4 class="tituloSecaoEditarParticipanteAdmin">Minicursos</h4>

                        {erroMinicursos && <p class="avisoErroModalParticipantesAdmin">{erroMinicursos}</p>}

                        {carregandoMinicursos ? (
                            <p class="estadoCarregandoParticipantesAdmin">Carregando…</p>
                        ) : (
                            <>
                                {minicursosInscritosOrdenados.length === 0 ? (
                                    <p class="dicaSenhaAdicionarParticipanteAdmin">
                                        Não está em nenhum minicurso.
                                    </p>
                                ) : (
                                    <ul class="listaConquistasParticipanteAdmin">
                                        {minicursosInscritosOrdenados.map(({ evento, status }) => {
                                            const confirmandoRemover = idConfirmandoRemoverMinicurso === evento.id
                                            const presente = status === 'PRESENTE'
                                            return (
                                                <li class="itemConquistaParticipanteAdmin" key={evento.id}>
                                                    <div class="textoItemConquistaParticipanteAdmin">
                                                        <span class="nomeItemConquistaParticipanteAdmin">{evento.nome}</span>
                                                        <span class="detalheItemConquistaParticipanteAdmin">
                                                            {textoHorarioMinicurso(evento)} · {ROTULO_STATUS_MINICURSO[status] ?? status}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        class={`botaoAcaoLinhaFinancas ${confirmandoRemover ? 'botaoConfirmarExclusaoFinancas' : ''}`}
                                                        disabled={presente || idRemovendoMinicurso === evento.id}
                                                        title={
                                                            presente
                                                                ? 'Presença já registrada — não dá para remover'
                                                                : confirmandoRemover
                                                                    ? 'Clique novamente para confirmar'
                                                                    : 'Remover do minicurso'
                                                        }
                                                        onClick={() => removerMinicurso(evento)}
                                                    >
                                                        {confirmandoRemover ? 'Confirmar' : 'Remover'}
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}

                                <div class="linhaAdicionarMinicursoEditarParticipanteAdmin">
                                    <select
                                        class="selectPapelComissaoModalAdmin selectMinicursoEditarParticipanteAdmin"
                                        aria-label="Minicurso para adicionar"
                                        value={minicursoSelecionadoId}
                                        disabled={adicionandoMinicurso}
                                        onChange={e => setMinicursoSelecionadoId(e.target.value)}
                                    >
                                        <option value="">Adicionar a um minicurso…</option>
                                        {minicursosDisponiveis.map(evento => {
                                            const esgotado = (evento.vagasRestantes ?? 0) <= 0
                                            return (
                                                <option key={evento.id} value={evento.id} disabled={esgotado}>
                                                    {textoHorarioMinicurso(evento)} — {evento.nome}
                                                    {esgotado ? ' (esgotado)' : ` (${evento.vagasRestantes} vagas)`}
                                                </option>
                                            )
                                        })}
                                    </select>
                                    <button
                                        type="button"
                                        class="botaoSalvarModalParticipantesAdmin"
                                        onClick={adicionarMinicurso}
                                        disabled={!minicursoSelecionadoId || adicionandoMinicurso}
                                    >
                                        {adicionandoMinicurso ? 'Adicionando...' : 'Adicionar'}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                <div class="rodapeModalParticipantesAdmin">
                    <button
                        type="button"
                        class="botaoCancelarModalParticipantesAdmin"
                        onClick={aoFechar}
                        disabled={ocupado}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
}
