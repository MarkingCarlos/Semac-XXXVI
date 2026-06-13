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
            const resposta = await fetch(`${API_URL}/api/inscricao`, {
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

            if (resposta.status === 201) {
                setFeedback({ tipo: 'sucesso', msg: 'Inscrição realizada com sucesso!' })
                setForm({ nome: '', cpf: '', ra: '', email: '', senha: '' })
                setEtapa('dados')
            } else if (resposta.status === 409) {
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
        <div class="boxInscricao">

            {/* ── Abas ───────────────────────────────────────────── */}
            <div class="abasInscricao">
                <button
                    class={`abaInscricao ${aba === 'inscricao' ? 'abaInscricaoAtiva' : ''}`}
                    onClick={() => trocarAba('inscricao')}
                >
                    Inscrever-se
                </button>
                <button
                    class={`abaInscricao ${aba === 'entrar' ? 'abaInscricaoAtiva' : ''}`}
                    onClick={() => trocarAba('entrar')}
                >
                    Entrar
                </button>
            </div>

            {/* ── Área de conteúdo com fade na troca de aba ────────── */}
            <div class={`areaAbasInscricao${abaSaindo ? ' areaAbasInscricaoSaindo' : ''}`}>

                {/* ── Formulário: Inscrever-se ──────────────────────── */}
                {aba === 'inscricao' && (
                    <>
                        {/* Indicador de progresso — oculto na tela de comemoração */}
                        {etapa !== 'comemoracao' && (
                            <div class="indicadorEtapasInscricao">
                                <div class={`passoEtapaInscricao ${etapa === 'dados' ? 'passoEtapaInscricaoAtivo' : 'passoEtapaInscricaoConcluido'}`}>
                                    <span class="numeroEtapaInscricao">{etapa === 'dados' ? '1' : '✓'}</span>
                                    <span class="nomeEtapaInscricao">Seus dados</span>
                                </div>
                                <span class="linhaEtapaInscricao" />
                                <div class={`passoEtapaInscricao ${etapa === 'camisa' ? 'passoEtapaInscricaoAtivo' : ''}`}>
                                    <span class="numeroEtapaInscricao">2</span>
                                    <span class="nomeEtapaInscricao">Camiseta</span>
                                </div>
                            </div>
                        )}

                        {/* ── Etapa 1: Dados pessoais ───────────────── */}
                        {etapa === 'dados' && (
                            <form class="formularioInscricao" onSubmit={e => { e.preventDefault(); setEtapa('comemoracao') }}>
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
                                    class="botaoConfirmarInscricao"
                                    disabled={!senhaValida}
                                >
                                    Próxima etapa
                                </button>
                            </form>
                        )}

                        {/* ── Tela de comemoração ───────────────────── */}
                        {etapa === 'comemoracao' && (
                            <div class="conteinerComemoracaoInscricao">
                                <div class="tituloComemoracaoInscricao" ref={tituloRef}>
                                     PARABÉNS!
                                </div>
                                <p class="subtituloComemoracaoInscricao" ref={subtituloRef}>
                                    Você ganhou uma <strong>camiseta exclusiva</strong> da SEMAC XXXVI!
                                </p>
                                <button
                                    class="botaoConfirmarInscricao"
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
                            <form class="formularioInscricao" onSubmit={handleSubmitInscricao}>
                                <div class="secaoCamisaInscricao">
                                    <span class="rotuloCampoInscricao">Tipo de Camiseta</span>
                                    <div class="modelosCamisaInscricao">
                                        {MODELOS.map(modeloOpcao => (
                                            <button
                                                key={modeloOpcao}
                                                type="button"
                                                class={`botaoModeloInscricao ${modelo === modeloOpcao ? 'botaoModeloInscricaoAtivo' : ''}`}
                                                onClick={() => setModelo(modeloOpcao)}
                                            >
                                                {LABEL_MODELO[modeloOpcao]}
                                            </button>
                                        ))}
                                    </div>

                                    <span class="rotuloCampoInscricao" style={{ marginTop: '0.5rem' }}>Tamanho</span>
                                    <div class="tamanhosCamisaInscricao">
                                        {TAMANHOS.map(tamanhoOpcao => (
                                            <button
                                                key={tamanhoOpcao}
                                                type="button"
                                                class={`botaoTamanhoInscricao ${tamanho === tamanhoOpcao ? 'botaoTamanhoInscricaoAtivo' : ''}`}
                                                onClick={() => setTamanho(tamanhoOpcao)}
                                            >
                                                {tamanhoOpcao}
                                            </button>
                                        ))}
                                    </div>

                                    <span class="avisoCamisaInscricao">
                                        Você receberá a camiseta juntamente com o kit SEMAC no dia do evento.
                                    </span>
                                </div>

                                {feedback && (
                                    <p class={`feedbackInscricao feedbackInscricao${feedback.tipo.charAt(0).toUpperCase() + feedback.tipo.slice(1)}`}>{feedback.msg}</p>
                                )}

                                <button type="submit" class="botaoConfirmarInscricao" disabled={enviando}>
                                    {enviando ? 'Enviando...' : 'Confirmar Inscrição'}
                                </button>
                            </form>
                        )}
                    </>
                )}

                {/* ── Formulário: Entrar ────────────────────────────── */}
                {aba === 'entrar' && (
                    <form class="formularioInscricao" onSubmit={handleSubmitEntrar}>
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
                        <button type="submit" class="botaoConfirmarInscricao">
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
        <div class="campoInscricao">
            <label class="rotuloCampoInscricao">{label}</label>
            <input
                class="inputCampoInscricao"
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
        <div class="campoInscricao">
            <label class="rotuloCampoInscricao">Senha</label>
            <input
                class="inputCampoInscricao"
                type="password"
                value={value}
                onInput={onInput}
                required={required}
            />
            {senhaOk && (
                <div class="validacaoSenhaInscricao">
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
        <span class={`indicadorSenhaInscricao ${ok ? 'indicadorSenhaOkInscricao' : ''}`}>
            <span class="caixaIndicadorSenhaInscricao" />
            {texto}
        </span>
    )
}
