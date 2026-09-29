import { useState, useRef, useEffect } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { CampoTexto, CampoSenha, Feedback } from './BoxInscricao.jsx'
import {
    solicitarCodigoRecuperacaoSenha,
    verificarCodigoRecuperacaoSenha,
    redefinirSenhaRecuperacao,
} from './apiRecuperacaoSenha.js'
import './modalRecuperarSenha.css'

/* Recuperação de senha, aberta pelo "Esqueci minha senha" da aba Entrar.
   Três etapas: e-mail → código de 5 dígitos → senha nova.

   O front só espelha as regras — quem manda é o backend
   (RecuperacaoSenhaService): código de uso único, válido por 15 minutos,
   3 erros bloqueiam por 30. O intervalo de reenvio aqui (60s) é o mesmo
   do backend; clicar antes disso não mandaria e-mail nenhum. */

const QUANTIDADE_DIGITOS_CODIGO = 5
const SEGUNDOS_ENTRE_REENVIOS = 60
const DIGITOS_VAZIOS = Array(QUANTIDADE_DIGITOS_CODIGO).fill('')

function formatarContagem(segundos) {
    const minutos = Math.floor(segundos / 60)
    const resto = String(segundos % 60).padStart(2, '0')
    return `${minutos}:${resto}`
}

function mensagemDeErro(erro) {
    return erro.status ? erro.message : 'Não foi possível conectar ao servidor.'
}

export default function ModalRecuperarSenha({ emailInicial, aoFechar, aoConcluir }) {
    const [etapa, setEtapa] = useState('email') // 'email' | 'codigo' | 'senha' | 'concluido'
    const [email, setEmail] = useState(emailInicial ?? '')
    const [digitosCodigo, setDigitosCodigo] = useState(DIGITOS_VAZIOS)
    const [tokenTroca, setTokenTroca] = useState(null)
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmacaoSenha, setConfirmacaoSenha] = useState('')

    const [enviando, setEnviando] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const [segundosReenvio, setSegundosReenvio] = useState(0)
    const [segundosBloqueio, setSegundosBloqueio] = useState(0)

    const refsDigitosCodigo = useRef([])

    const codigo = digitosCodigo.join('')
    const codigoCompleto = codigo.length === QUANTIDADE_DIGITOS_CODIGO
    const bloqueado = segundosBloqueio > 0

    const senhaOk = {
        especial:  /[^a-zA-Z0-9]/.test(novaSenha),
        maiusculo: /[A-Z]/.test(novaSenha),
        minimo8:   novaSenha.length >= 8,
    }
    const senhaValida = senhaOk.especial && senhaOk.maiusculo && senhaOk.minimo8
    const senhasConferem = novaSenha === confirmacaoSenha

    // Um único relógio para as duas contagens (reenvio e bloqueio).
    useEffect(() => {
        if (segundosReenvio <= 0 && segundosBloqueio <= 0) return
        const intervalo = setInterval(() => {
            setSegundosReenvio(s => Math.max(0, s - 1))
            setSegundosBloqueio(s => Math.max(0, s - 1))
        }, 1000)
        return () => clearInterval(intervalo)
    }, [segundosReenvio > 0, segundosBloqueio > 0])

    // Bloqueio cumprido: o código antigo foi queimado, é preciso pedir outro.
    useEffect(() => {
        if (etapa === 'codigo' && segundosBloqueio === 0 && feedback?.bloqueio) {
            setFeedback({ tipo: 'erro', msg: 'Você já pode tentar de novo. Peça um novo código.' })
        }
    }, [segundosBloqueio])

    useEffect(() => {
        function fecharComEsc(e) {
            if (e.key === 'Escape' && !enviando) aoFechar()
        }
        document.addEventListener('keydown', fecharComEsc)
        return () => document.removeEventListener('keydown', fecharComEsc)
    }, [enviando, aoFechar])

    useEffect(() => {
        if (etapa === 'codigo') refsDigitosCodigo.current[0]?.focus()
    }, [etapa])

    /* ── Etapa 1: e-mail ─────────────────────────────────────────── */

    async function enviarCodigo(e) {
        e?.preventDefault()
        setEnviando(true)
        setFeedback(null)
        try {
            const resposta = await solicitarCodigoRecuperacaoSenha(email.trim())
            setDigitosCodigo(DIGITOS_VAZIOS)
            setSegundosReenvio(SEGUNDOS_ENTRE_REENVIOS)
            setEtapa('codigo')
            setFeedback({ tipo: 'sucesso', msg: resposta?.mensagem || 'Código enviado.' })
            refsDigitosCodigo.current[0]?.focus()
        } catch (erro) {
            setFeedback({ tipo: 'erro', msg: mensagemDeErro(erro) })
        } finally {
            setEnviando(false)
        }
    }

    /* ── Etapa 2: código ─────────────────────────────────────────── */

    function alterarDigitoCodigo(indice, valor) {
        const digito = valor.replace(/\D/g, '').slice(-1)
        setDigitosCodigo(atual => atual.map((d, i) => (i === indice ? digito : d)))
        if (digito && indice < QUANTIDADE_DIGITOS_CODIGO - 1) {
            refsDigitosCodigo.current[indice + 1]?.focus()
        }
    }

    function teclaDigitoCodigo(indice, e) {
        if (e.key === 'Backspace' && !digitosCodigo[indice] && indice > 0) {
            refsDigitosCodigo.current[indice - 1]?.focus()
        }
    }

    // Colar o código inteiro (vindo do e-mail) preenche as 5 caixas.
    function colarCodigo(e) {
        const colado = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, QUANTIDADE_DIGITOS_CODIGO)
        if (!colado) return
        e.preventDefault()
        const novos = DIGITOS_VAZIOS.map((_, i) => colado[i] ?? '')
        setDigitosCodigo(novos)
        refsDigitosCodigo.current[Math.min(colado.length, QUANTIDADE_DIGITOS_CODIGO - 1)]?.focus()
    }

    async function verificarCodigo(e) {
        e.preventDefault()
        if (!codigoCompleto || bloqueado) return
        setEnviando(true)
        setFeedback(null)
        try {
            const token = await verificarCodigoRecuperacaoSenha(email.trim(), codigo)
            setTokenTroca(token)
            setEtapa('senha')
        } catch (erro) {
            if (erro.status === 429 && erro.segundosRestantes) {
                setSegundosBloqueio(erro.segundosRestantes)
                setFeedback({ tipo: 'erro', msg: erro.message, bloqueio: true })
            } else {
                setFeedback({ tipo: 'erro', msg: mensagemDeErro(erro) })
            }
            setDigitosCodigo(DIGITOS_VAZIOS)
            refsDigitosCodigo.current[0]?.focus()
        } finally {
            setEnviando(false)
        }
    }

    /* ── Etapa 3: senha nova ─────────────────────────────────────── */

    async function trocarSenha(e) {
        e.preventDefault()
        if (!senhaValida || !senhasConferem) return
        setEnviando(true)
        setFeedback(null)
        try {
            await redefinirSenhaRecuperacao(tokenTroca, novaSenha)
            setEtapa('concluido')
        } catch (erro) {
            setFeedback({ tipo: 'erro', msg: mensagemDeErro(erro) })
        } finally {
            setEnviando(false)
        }
    }

    // Portal no body: o card de inscrição tem animação/transform, que
    // prenderia um position:fixed dentro dele.
    return createPortal(
        <div class="overlayModalRecuperarSenha" onClick={enviando ? undefined : aoFechar}>
            <div
                class="cardModalRecuperarSenha"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tituloModalRecuperarSenha"
                onClick={e => e.stopPropagation()}
            >
                <button
                    type="button"
                    class="botaoFecharModalRecuperarSenha"
                    aria-label="Fechar"
                    onClick={aoFechar}
                    disabled={enviando}
                >
                    ×
                </button>

                <h2 id="tituloModalRecuperarSenha" class="tituloModalRecuperarSenha">
                    {etapa === 'concluido' ? 'Senha trocada' : 'Recuperar senha'}
                </h2>

                {etapa === 'email' && (
                    <form class="formularioModalRecuperarSenha" onSubmit={enviarCodigo}>
                        <p class="textoModalRecuperarSenha">
                            Digite o e-mail da sua inscrição. Vamos mandar um código de 5 dígitos para ele.
                        </p>
                        <CampoTexto
                            label="E-mail"
                            type="email"
                            value={email}
                            onInput={e => setEmail(e.target.value)}
                            required
                        />
                        {feedback && <Feedback feedback={feedback} />}
                        <button type="submit" class="botaoConfirmarInscricao" disabled={enviando || !email.trim()}>
                            {enviando ? 'Enviando…' : 'Enviar código'}
                        </button>
                    </form>
                )}

                {etapa === 'codigo' && (
                    <form class="formularioModalRecuperarSenha" onSubmit={verificarCodigo}>
                        <p class="textoModalRecuperarSenha">
                            Digite o código enviado para <strong>{email.trim()}</strong>. Ele vale por 15 minutos.
                        </p>
                        <div class="grupoDigitosCodigoRecuperarSenha" onPaste={colarCodigo}>
                            {digitosCodigo.map((digito, indice) => (
                                <input
                                    key={indice}
                                    ref={el => { refsDigitosCodigo.current[indice] = el }}
                                    class="inputDigitoCodigoRecuperarSenha"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete={indice === 0 ? 'one-time-code' : 'off'}
                                    maxLength={1}
                                    aria-label={`Dígito ${indice + 1} do código`}
                                    value={digito}
                                    disabled={bloqueado || enviando}
                                    onInput={e => alterarDigitoCodigo(indice, e.currentTarget.value)}
                                    onKeyDown={e => teclaDigitoCodigo(indice, e)}
                                />
                            ))}
                        </div>

                        {feedback && <Feedback feedback={feedback} />}
                        {bloqueado && (
                            <p class="contagemBloqueioRecuperarSenha">
                                Nova tentativa em {formatarContagem(segundosBloqueio)}
                            </p>
                        )}

                        <button
                            type="submit"
                            class="botaoConfirmarInscricao"
                            disabled={enviando || bloqueado || !codigoCompleto}
                        >
                            {enviando ? 'Verificando…' : 'Verificar código'}
                        </button>

                        <div class="acoesSecundariasRecuperarSenha">
                            <button
                                type="button"
                                class="botaoLinkRecuperarSenha"
                                onClick={() => { setFeedback(null); setEtapa('email') }}
                                disabled={enviando}
                            >
                                Trocar e-mail
                            </button>
                            <button
                                type="button"
                                class="botaoLinkRecuperarSenha"
                                onClick={() => enviarCodigo()}
                                disabled={enviando || bloqueado || segundosReenvio > 0}
                            >
                                {segundosReenvio > 0
                                    ? `Reenviar código (${segundosReenvio}s)`
                                    : 'Reenviar código'}
                            </button>
                        </div>
                    </form>
                )}

                {etapa === 'senha' && (
                    <form class="formularioModalRecuperarSenha" onSubmit={trocarSenha}>
                        <p class="textoModalRecuperarSenha">Código confirmado. Escolha sua senha nova.</p>
                        <CampoSenha
                            label="Nova senha"
                            value={novaSenha}
                            onInput={e => setNovaSenha(e.target.value)}
                            senhaOk={senhaOk}
                            permitirVerSenha
                            required
                        />
                        <CampoSenha
                            label="Confirme a nova senha"
                            value={confirmacaoSenha}
                            onInput={e => setConfirmacaoSenha(e.target.value)}
                            permitirVerSenha
                            required
                        />
                        {confirmacaoSenha && !senhasConferem && (
                            <p class="avisoSenhasDiferentesRecuperarSenha">As senhas não são iguais.</p>
                        )}
                        {feedback && <Feedback feedback={feedback} />}
                        <button
                            type="submit"
                            class="botaoConfirmarInscricao"
                            disabled={enviando || !senhaValida || !senhasConferem}
                        >
                            {enviando ? 'Salvando…' : 'Trocar senha'}
                        </button>
                    </form>
                )}

                {etapa === 'concluido' && (
                    <div class="formularioModalRecuperarSenha">
                        <p class="textoModalRecuperarSenha">
                            Pronto! Sua senha foi trocada. Já pode entrar com a senha nova.
                        </p>
                        <button type="button" class="botaoConfirmarInscricao" onClick={() => aoConcluir(email.trim())}>
                            Voltar para o login
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}
