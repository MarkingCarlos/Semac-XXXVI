import { useState, useRef, useEffect } from 'preact/hooks'
import gsap from 'gsap'
import './boxInscricao.css'

const API_URL = import.meta.env.VITE_API_URL

const MODELOS  = ['BABY_LOOK', 'NORMAL']
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG']
const LABEL_MODELO = { BABY_LOOK: 'Baby Look', NORMAL: 'Normal' }

// Aplica a máscara de CPF enquanto o usuário digita: 000.000.000-00
function mascaraCPF(valor) {
    return valor
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14)
}

export default function BoxInscricao() {
    const [aba,       setAba]       = useState('inscricao')
    const [abaSaindo, setAbaSaindo] = useState(false)
    const [etapa,     setEtapa]     = useState('dados') // 'dados' | 'comemoracao' | 'camisa'

    const [form, setForm] = useState({ nome: '', cpf: '', ra: '', email: '', senha: '' })
    const [modelo,  setModelo]  = useState('BABY_LOOK')
    const [tamanho, setTamanho] = useState('M')

    const [enviando, setEnviando] = useState(false)
    const [feedback, setFeedback] = useState(null) // { tipo: 'sucesso'|'erro', msg: string }

    const tituloRef    = useRef(null)
    const subtituloRef = useRef(null)
    const btnCamisaRef = useRef(null)

    const senhaOk = {
        especial:  /[^a-zA-Z0-9]/.test(form.senha),
        maiusculo: /[A-Z]/.test(form.senha),
        minimo8:   form.senha.length >= 8,
    }
    const senhaValida = senhaOk.especial && senhaOk.maiusculo && senhaOk.minimo8

    function setField(campo, valor) {
        setForm(prev => ({ ...prev, [campo]: valor }))
    }

    // Troca de aba com fade-out suave (200 ms) antes de trocar o conteúdo
    function trocarAba(novaAba) {
        if (novaAba === aba) return
        setAbaSaindo(true)
        setTimeout(() => {
            setAba(novaAba)
            if (novaAba === 'inscricao') setEtapa('dados')
            setAbaSaindo(false)
        }, 200)
    }

    // Animação de comemoração — só texto, sem partículas
    useEffect(() => {
        if (etapa !== 'comemoracao') return

        gsap.set(tituloRef.current,    { opacity: 0, y: -40, scale: 0.6 })
        gsap.set(subtituloRef.current, { opacity: 0, y: 20 })
        gsap.set(btnCamisaRef.current, { opacity: 0, y: 15 })

        gsap.to(tituloRef.current,    { opacity: 1, y: 0, scale: 1, duration: 0.7,  ease: 'back.out(1.7)', delay: 0.15 })
        gsap.to(subtituloRef.current, { opacity: 1, y: 0,           duration: 0.55, ease: 'power2.out',    delay: 0.55 })
        gsap.to(btnCamisaRef.current, { opacity: 1, y: 0,           duration: 0.45, ease: 'back.out(1.4)', delay: 1.6  })
    }, [etapa])

    async function handleSubmitInscricao(e) {
        e.preventDefault()
        setEnviando(true)
        setFeedback(null)

        try {
            const res = await fetch(`${API_URL}/api/inscricao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome:    form.nome,
                    cpf:     form.cpf.replace(/\D/g, ''),
                    ra:      form.ra || null,
                    email:   form.email,
                    senha:   form.senha,
                    modelo,
                    tamanho,
                }),
            })

            if (res.status === 201) {
                setFeedback({ tipo: 'sucesso', msg: 'Inscrição realizada com sucesso!' })
                setForm({ nome: '', cpf: '', ra: '', email: '', senha: '' })
                setEtapa('dados')
            } else if (res.status === 409) {
                setFeedback({ tipo: 'erro', msg: 'CPF ou e-mail já cadastrado.' })
            } else {
                setFeedback({ tipo: 'erro', msg: 'Erro ao realizar inscrição. Tente novamente.' })
            }
        } catch {
            setFeedback({ tipo: 'erro', msg: 'Não foi possível conectar ao servidor.' })
        } finally {
            setEnviando(false)
        }
    }

    function handleSubmitEntrar(e) {
        e.preventDefault()
        // TODO: POST /api/auth/login
        console.log({ email: form.email, senha: form.senha })
    }

    return (
        <div class="box-inscricao">

            {/* ── Abas ───────────────────────────────────────────── */}
            <div class="box-abas">
                <button
                    class={`aba ${aba === 'inscricao' ? 'aba-ativa' : ''}`}
                    onClick={() => trocarAba('inscricao')}
                >
                    Inscrever-se
                </button>
                <button
                    class={`aba ${aba === 'entrar' ? 'aba-ativa' : ''}`}
                    onClick={() => trocarAba('entrar')}
                >
                    Entrar
                </button>
            </div>

            {/* ── Área de conteúdo com fade na troca de aba ────────── */}
            <div class={`tab-area${abaSaindo ? ' tab-saindo' : ''}`}>

                {/* ── Formulário: Inscrever-se ──────────────────────── */}
                {aba === 'inscricao' && (
                    <>
                        {/* Indicador de progresso — oculto na tela de comemoração */}
                        {etapa !== 'comemoracao' && (
                            <div class="etapa-indicador">
                                <div class={`etapa-passo ${etapa === 'dados' ? 'etapa-passo-ativo' : 'etapa-passo-concluido'}`}>
                                    <span class="etapa-num">{etapa === 'dados' ? '1' : '✓'}</span>
                                    <span class="etapa-nome">Seus dados</span>
                                </div>
                                <span class="etapa-linha" />
                                <div class={`etapa-passo ${etapa === 'camisa' ? 'etapa-passo-ativo' : ''}`}>
                                    <span class="etapa-num">2</span>
                                    <span class="etapa-nome">Camiseta</span>
                                </div>
                            </div>
                        )}

                        {/* ── Etapa 1: Dados pessoais ───────────────── */}
                        {etapa === 'dados' && (
                            <form class="box-form" onSubmit={e => { e.preventDefault(); setEtapa('comemoracao') }}>
                                <CampoTexto
                                    label="Nome Completo"
                                    value={form.nome}
                                    onInput={e => setField('nome', e.target.value)}
                                    required
                                />
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                                    <CampoTexto
                                        label="CPF"
                                        value={form.cpf}
                                        onInput={e => setField('cpf', mascaraCPF(e.target.value))}
                                        inputMode="numeric"
                                        required
                                    />
                                    <CampoTexto
                                        label="RA (opcional)"
                                        value={form.ra}
                                        onInput={e => setField('ra', e.target.value)}
                                        inputMode="numeric"
                                    />
                                </div>
                                <CampoTexto
                                    label="E-mail"
                                    type="email"
                                    value={form.email}
                                    onInput={e => setField('email', e.target.value)}
                                    required
                                />
                                <CampoSenha
                                    value={form.senha}
                                    onInput={e => setField('senha', e.target.value)}
                                    senhaOk={senhaOk}
                                    required
                                />
                                <button
                                    type="submit"
                                    class="btn-confirmar"
                                    disabled={!senhaValida}
                                >
                                    Próxima etapa
                                </button>
                            </form>
                        )}

                        {/* ── Tela de comemoração ───────────────────── */}
                        {etapa === 'comemoracao' && (
                            <div class="comemoracao-container">
                                <div class="comemoracao-titulo" ref={tituloRef}>
                                     PARABÉNS!
                                </div>
                                <p class="comemoracao-subtitulo" ref={subtituloRef}>
                                    Você ganhou uma <strong>camiseta exclusiva</strong> da SEMAC XXXVI!
                                </p>
                                <button
                                    class="btn-confirmar"
                                    ref={btnCamisaRef}
                                    onClick={() => setEtapa('camisa')}
                                    style={{ opacity: 0 }}
                                >
                                    Escolher minha camiseta →
                                </button>
                            </div>
                        )}

                        {/* ── Etapa 2: Escolha da camiseta ─────────── */}
                        {etapa === 'camisa' && (
                            <form class="box-form" onSubmit={handleSubmitInscricao}>
                                <div class="camisa-secao">
                                    <span class="campo-label">Tipo de Camiseta</span>
                                    <div class="camisa-modelos">
                                        {MODELOS.map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                class={`btn-modelo ${modelo === m ? 'btn-modelo-ativo' : ''}`}
                                                onClick={() => setModelo(m)}
                                            >
                                                {LABEL_MODELO[m]}
                                            </button>
                                        ))}
                                    </div>

                                    <span class="campo-label" style={{ marginTop: '0.5rem' }}>Tamanho</span>
                                    <div class="camisa-tamanhos">
                                        {TAMANHOS.map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                class={`btn-tamanho ${tamanho === t ? 'btn-tamanho-ativo' : ''}`}
                                                onClick={() => setTamanho(t)}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>

                                    <span class="camisa-aviso">
                                        Você receberá a camiseta juntamente com o kit SEMAC no dia do evento.
                                    </span>
                                </div>

                                {feedback && (
                                    <p class={`feedback feedback-${feedback.tipo}`}>{feedback.msg}</p>
                                )}

                                <button type="submit" class="btn-confirmar" disabled={enviando}>
                                    {enviando ? 'Enviando...' : 'Confirmar Inscrição'}
                                </button>
                            </form>
                        )}
                    </>
                )}

                {/* ── Formulário: Entrar ────────────────────────────── */}
                {aba === 'entrar' && (
                    <form class="box-form" onSubmit={handleSubmitEntrar}>
                        <CampoTexto
                            label="E-mail"
                            type="email"
                            value={form.email}
                            onInput={e => setField('email', e.target.value)}
                            required
                        />
                        <CampoSenha
                            value={form.senha}
                            onInput={e => setField('senha', e.target.value)}
                            required
                        />
                        <button type="submit" class="btn-confirmar">
                            Entrar
                        </button>
                    </form>
                )}

            </div>
        </div>
    )
}

// ── Subcomponentes ──────────────────────────────────────────────

// Campo de texto genérico com label uppercase e borda inferior
function CampoTexto({ label, type = 'text', value, onInput, inputMode, required }) {
    return (
        <div class="campo">
            <label class="campo-label">{label}</label>
            <input
                class="campo-input"
                type={type}
                value={value}
                onInput={onInput}
                inputMode={inputMode}
                required={required}
            />
        </div>
    )
}

// Campo de senha com indicadores de validação abaixo.
// `senhaOk` é opcional — quando ausente (aba "Entrar"), os indicadores são omitidos.
function CampoSenha({ value, onInput, senhaOk, required }) {
    return (
        <div class="campo">
            <label class="campo-label">Senha</label>
            <input
                class="campo-input"
                type="password"
                value={value}
                onInput={onInput}
                required={required}
            />
            {senhaOk && (
                <div class="senha-validacao">
                    <Indicador ok={senhaOk.especial}  texto="1 caractere especial" />
                    <Indicador ok={senhaOk.maiusculo} texto="1 caractere maiúsculo" />
                    <Indicador ok={senhaOk.minimo8}   texto="No mínimo 8 caracteres" />
                </div>
            )}
        </div>
    )
}

// Indicador visual de requisito de senha: caixinha + texto, verde quando ok
function Indicador({ ok, texto }) {
    return (
        <span class={`indicadorSenha ${ok ? 'indicador-ok' : ''}`}>
            <span class="indicador-box" />
            {texto}
        </span>
    )
}
