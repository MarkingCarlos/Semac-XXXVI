// Cadastro manual de participante, acionado pelo botão "Adicionar
// participante" na aba Participantes do /admin. É a inscrição de balcão:
// quem pagou em dinheiro, ganhou cortesia ou se inscreveu presencialmente
// e nunca passou pelo formulário público de /inscricoes.
//
// Envia POST /api/pessoa (PessoaService.cadastrarManual). Diferente do
// cadastro público, aqui não há código de acesso do ingresso nem restrição
// de ingresso exclusivo da UNESP — quem cadastra é a própria comissão. A
// senha é definida por quem cadastra e deve ser repassada à pessoa: é com
// ela que dá pra entrar na área /participantes depois.
//
// Props:
//   aoFechar  — () => void, fecha o modal
//   aoCriado  — (pessoaCriada) => void, recebe a pessoa no formato da
//               listagem para entrar na tabela sem recarregar

import { useState, useEffect } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { cadastrarParticipante } from './data/apiParticipantes.js'
import { listarTiposInscricao } from './data/apiTipoInscricao.js'
import './modalAdicionarParticipante.css'

const ANO_ATUAL = new Date().getFullYear()

const MODELOS = [
    { valor: 'NORMAL', rotulo: 'Normal' },
    { valor: 'BABY_LOOK', rotulo: 'Baby Look' },
]
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG']

const camisetaPadrao = (avulsa = false) => ({ modelo: 'NORMAL', tamanho: 'M', avulsa })

// Máscara de CPF enquanto digita: 000.000.000-00 (mesma do BoxInscricao).
function mascaraCPF(valor) {
    return valor
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14)
}

// Máscara de telefone: (00) 00000-0000 (celular) ou (00) 0000-0000 (fixo).
function mascaraTelefone(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11)
    if (digitos.length <= 10) {
        return digitos
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return digitos
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
}

const formularioVazio = {
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    ra: '',
    senha: '',
    ehUnesp: false,
    confirmar: true,
}

export default function ModalAdicionarParticipante({ aoFechar, aoCriado }) {
    const [formulario, setFormulario] = useState(formularioVazio)
    const [camisetas, setCamisetas] = useState([])

    const [ingressos, setIngressos] = useState([])
    const [carregandoIngressos, setCarregandoIngressos] = useState(true)
    const [ingressoSelecionadoId, setIngressoSelecionadoId] = useState(null)
    const [dias, setDias] = useState(1)

    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState(null)

    const ingressoSelecionado = ingressos.find(i => i.id === ingressoSelecionadoId) ?? null

    useEffect(() => {
        let ativo = true
        listarTiposInscricao(ANO_ATUAL)
            .then(lista => { if (ativo) setIngressos(lista.filter(tipo => tipo.ativo)) })
            .catch(e => { if (ativo) setErro(e.message) })
            .finally(() => { if (ativo) setCarregandoIngressos(false) })
        return () => { ativo = false }
    }, [])

    function atualizarCampo(campo, valor) {
        setFormulario(anterior => ({ ...anterior, [campo]: valor }))
    }

    // Trocar o ingresso remonta a lista de camisetas com as inclusas dele
    // (o caso comum no balcão); avulsas e ajustes de tamanho são feitos
    // depois, nas linhas abaixo.
    function selecionarIngresso(id) {
        const ingresso = ingressos.find(i => i.id === id) ?? null
        setIngressoSelecionadoId(id)
        setDias(1)
        setCamisetas(Array.from({ length: ingresso?.camisetasGratis ?? 0 }, () => camisetaPadrao(false)))
    }

    function atualizarCamiseta(indice, campo, valor) {
        setCamisetas(camisetas.map((linha, i) => (i === indice ? { ...linha, [campo]: valor } : linha)))
    }

    function removerCamiseta(indice) {
        setCamisetas(camisetas.filter((_, i) => i !== indice))
    }

    const digitosCpf = formulario.cpf.replace(/\D/g, '')
    const digitosTelefone = formulario.telefone.replace(/\D/g, '')
    // RA continua obrigatório para quem é da UNESP, como no cadastro
    // público; a exigência de e-mail @unesp.br fica de fora de propósito —
    // no balcão o organizador é quem sabe com quem está falando.
    const formularioValido = formulario.nome.trim()
        && formulario.email.trim()
        && digitosCpf.length === 11
        && digitosTelefone.length >= 10
        && formulario.senha.length >= 8
        && ingressoSelecionadoId != null
        && (!formulario.ehUnesp || formulario.ra.trim())
        && (!ingressoSelecionado?.porDia || (dias >= 1 && dias <= (ingressoSelecionado.maxDias ?? 1)))

    async function salvar() {
        setSalvando(true)
        setErro(null)
        try {
            const criado = await cadastrarParticipante({
                nome: formulario.nome.trim(),
                email: formulario.email.trim(),
                cpf: digitosCpf,
                telefone: digitosTelefone,
                ra: formulario.ra.trim() || null,
                senha: formulario.senha,
                ehUnesp: formulario.ehUnesp,
                tipoInscricaoId: ingressoSelecionadoId,
                dias: ingressoSelecionado?.porDia ? Number(dias) : null,
                camisetas,
                confirmar: formulario.confirmar,
            })
            aoCriado(criado)
            aoFechar()
        } catch (e) {
            setErro(e.message)
            setSalvando(false)
        }
    }

    return createPortal(
        <div class="overlayModalParticipantesAdmin" onClick={salvando ? undefined : aoFechar}>
            <div
                class="modalConfirmarParticipantesAdmin modalAdicionarParticipanteAdmin"
                onClick={e => e.stopPropagation()}
            >
                <h3 class="tituloModalParticipantesAdmin">Adicionar participante</h3>
                <p class="subtituloModalParticipantesAdmin">
                    Cadastro manual, para quem se inscreveu no balcão e não passou pelo site.
                </p>

                <div class="gradeCamposAdicionarParticipanteAdmin">
                    <div class="campoFormularioAdicionarParticipanteAdmin campoLargoAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputNomeAdicionarParticipante">
                            Nome completo
                        </label>
                        <input
                            id="inputNomeAdicionarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="text"
                            value={formulario.nome}
                            disabled={salvando}
                            onInput={e => atualizarCampo('nome', e.currentTarget.value)}
                        />
                    </div>

                    <div class="campoFormularioAdicionarParticipanteAdmin campoLargoAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputEmailAdicionarParticipante">
                            E-mail
                        </label>
                        <input
                            id="inputEmailAdicionarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="email"
                            value={formulario.email}
                            disabled={salvando}
                            onInput={e => atualizarCampo('email', e.currentTarget.value)}
                        />
                    </div>

                    <div class="campoFormularioAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputCpfAdicionarParticipante">
                            CPF
                        </label>
                        <input
                            id="inputCpfAdicionarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="text"
                            inputMode="numeric"
                            placeholder="000.000.000-00"
                            value={formulario.cpf}
                            disabled={salvando}
                            onInput={e => atualizarCampo('cpf', mascaraCPF(e.currentTarget.value))}
                        />
                    </div>

                    <div class="campoFormularioAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputTelefoneAdicionarParticipante">
                            Telefone
                        </label>
                        <input
                            id="inputTelefoneAdicionarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="text"
                            inputMode="numeric"
                            placeholder="(00) 00000-0000"
                            value={formulario.telefone}
                            disabled={salvando}
                            onInput={e => atualizarCampo('telefone', mascaraTelefone(e.currentTarget.value))}
                        />
                    </div>

                    <div class="campoFormularioAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputRaAdicionarParticipante">
                            RA {formulario.ehUnesp ? '' : '(opcional)'}
                        </label>
                        <input
                            id="inputRaAdicionarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="text"
                            value={formulario.ra}
                            disabled={salvando}
                            onInput={e => atualizarCampo('ra', e.currentTarget.value)}
                        />
                    </div>

                    <div class="campoFormularioAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputSenhaAdicionarParticipante">
                            Senha provisória
                        </label>
                        <input
                            id="inputSenhaAdicionarParticipante"
                            class="inputCampoAdicionarParticipanteAdmin"
                            type="text"
                            placeholder="mínimo 8 caracteres"
                            value={formulario.senha}
                            disabled={salvando}
                            onInput={e => atualizarCampo('senha', e.currentTarget.value)}
                        />
                    </div>

                    <p class="dicaSenhaAdicionarParticipanteAdmin campoLargoAdicionarParticipanteAdmin">
                        Repasse esta senha à pessoa — é com ela que entra na área de participantes.
                    </p>

                    <div class="campoFormularioAdicionarParticipanteAdmin campoLargoAdicionarParticipanteAdmin">
                        <label class="rotuloCampoAdicionarParticipanteAdmin" for="selectIngressoAdicionarParticipante">
                            Ingresso
                        </label>
                        <select
                            id="selectIngressoAdicionarParticipante"
                            class="selectPapelComissaoModalAdmin"
                            value={ingressoSelecionadoId ?? ''}
                            disabled={salvando || carregandoIngressos}
                            onChange={e => selecionarIngresso(Number(e.currentTarget.value) || null)}
                        >
                            <option value="">
                                {carregandoIngressos ? 'Carregando ingressos...' : 'Selecione o ingresso'}
                            </option>
                            {ingressos.map(ingresso => (
                                <option key={ingresso.id} value={ingresso.id}>{ingresso.nome}</option>
                            ))}
                        </select>
                    </div>

                    {ingressoSelecionado?.porDia && (
                        <div class="campoFormularioAdicionarParticipanteAdmin">
                            <label class="rotuloCampoAdicionarParticipanteAdmin" for="inputDiasAdicionarParticipante">
                                Diárias (1 a {ingressoSelecionado.maxDias ?? 1})
                            </label>
                            <input
                                id="inputDiasAdicionarParticipante"
                                class="inputCampoAdicionarParticipanteAdmin"
                                type="number"
                                min="1"
                                max={ingressoSelecionado.maxDias ?? 1}
                                value={dias}
                                disabled={salvando}
                                onInput={e => setDias(Number(e.currentTarget.value))}
                            />
                        </div>
                    )}
                </div>

                <div class="opcoesAdicionarParticipanteAdmin">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={formulario.ehUnesp}
                        disabled={salvando}
                        class={`switchOpcaoAdicionarParticipanteAdmin ${formulario.ehUnesp ? 'switchOpcaoAtivoAdicionarParticipanteAdmin' : ''}`}
                        onClick={() => atualizarCampo('ehUnesp', !formulario.ehUnesp)}
                    >
                        <span class="trilhoSwitchOpcaoAdicionarParticipanteAdmin">
                            <span class="bolinhaSwitchOpcaoAdicionarParticipanteAdmin" />
                        </span>
                        <span class="rotuloSwitchOpcaoAdicionarParticipanteAdmin">Estudante da UNESP</span>
                    </button>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={formulario.confirmar}
                        disabled={salvando}
                        class={`switchOpcaoAdicionarParticipanteAdmin ${formulario.confirmar ? 'switchOpcaoAtivoAdicionarParticipanteAdmin' : ''}`}
                        onClick={() => atualizarCampo('confirmar', !formulario.confirmar)}
                    >
                        <span class="trilhoSwitchOpcaoAdicionarParticipanteAdmin">
                            <span class="bolinhaSwitchOpcaoAdicionarParticipanteAdmin" />
                        </span>
                        <span class="rotuloSwitchOpcaoAdicionarParticipanteAdmin">
                            Já confirmar a inscrição
                        </span>
                    </button>
                </div>

                <p class="dicaConfirmarAdicionarParticipanteAdmin">
                    {formulario.confirmar
                        ? 'Entra já como participante, com xp inicial e pré-inscrição nos eventos abertos.'
                        : 'Entra na fila de aguardando confirmação, como quem se inscreve pelo site.'}
                </p>

                <h4 class="tituloBlocoCamisetasAdicionarParticipanteAdmin">Camisetas</h4>
                <div class="listaLinhasCamisetasAdmin">
                    {camisetas.length === 0 && (
                        <p class="vazioLinhasCamisetasAdmin">Nenhuma camiseta para esta pessoa.</p>
                    )}
                    {camisetas.map((linha, indice) => (
                        <div class="linhaCamisetaAdmin" key={indice}>
                            <select
                                class="selectPapelComissaoModalAdmin selectLinhaCamisetaAdmin"
                                value={linha.modelo}
                                disabled={salvando}
                                onChange={e => atualizarCamiseta(indice, 'modelo', e.currentTarget.value)}
                            >
                                {MODELOS.map(m => (
                                    <option key={m.valor} value={m.valor}>{m.rotulo}</option>
                                ))}
                            </select>
                            <select
                                class="selectPapelComissaoModalAdmin selectLinhaCamisetaAdmin selectTamanhoLinhaCamisetaAdmin"
                                value={linha.tamanho}
                                disabled={salvando}
                                onChange={e => atualizarCamiseta(indice, 'tamanho', e.currentTarget.value)}
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
                                    onClick={() => atualizarCamiseta(indice, 'avulsa', false)}
                                >
                                    Inclusa
                                </button>
                                <button
                                    type="button"
                                    class={`botaoAlternarAvulsaAdmin ${linha.avulsa ? 'botaoAlternarAvulsaAtivoAdmin' : ''}`}
                                    disabled={salvando}
                                    onClick={() => atualizarCamiseta(indice, 'avulsa', true)}
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
                                onClick={() => removerCamiseta(indice)}
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
                    onClick={() => setCamisetas([...camisetas, camisetaPadrao(true)])}
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
                        disabled={salvando || !formularioValido}
                    >
                        {salvando ? 'Cadastrando...' : 'Cadastrar'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
