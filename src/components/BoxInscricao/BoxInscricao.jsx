import { useState, useRef, useEffect } from 'preact/hooks'
import { useLocation } from 'wouter'
import gsap from 'gsap'
import { salvarSessao, temAcessoFinanceiro, temAcessoAdmin } from '../../auth/sessao.js'
import { apiFetch } from '../../lib/apiFetch.js'
import './boxInscricao.css'
import logoRaios from '../../assets/logoSemacRaios.png'
import qrCodePix from '../../assets/qr.png'

function lerParametrosNavegacao() {
    const params = new URLSearchParams(window.location.search)
    return { tab: params.get('tab'), next: params.get('next') }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const CHAVE_PIX = 'apoio@semac.cc'

const MODELOS  = ['BABY_LOOK', 'NORMAL']
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG']
const LABEL_MODELO = { BABY_LOOK: 'Baby Look', NORMAL: 'Normal' }

const ETAPAS_APOS_CAMISA = ['ingresso', 'pix', 'comprovante', 'sucesso']

// Aplica a máscara de CPF enquanto o usuário digita: 000.000.000-00
function mascaraCPF(valor) {
    return valor
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14)
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BoxInscricao() {
    const [, navigate] = useLocation()
    const { tab: tabInicial, next: rotaRetorno } = lerParametrosNavegacao()

    const [aba,       setAba]       = useState(tabInicial === 'entrar' ? 'entrar' : 'inscricao')
    const [abaSaindo, setAbaSaindo] = useState(false)
    const [etapa,     setEtapa]     = useState('dados')

    const [form, setForm] = useState({ nome: '', cpf: '', ra: '', email: '', senha: '' })
    const [modelo,  setModelo]  = useState('BABY_LOOK')
    const [tamanho, setTamanho] = useState('M')

    const [subEtapaDados,           setSubEtapaDados]           = useState('identificacao')

    const [tiposIngresso,           setTiposIngresso]           = useState([])
    const [carregandoIngressos,     setCarregandoIngressos]     = useState(false)
    const [tipoIngressoSelecionado, setTipoIngressoSelecionado] = useState(null)
    const [arquivoComprovante,      setArquivoComprovante]      = useState(null)
    const [previewComprovante,      setPreviewComprovante]      = useState(null)
    const [copiado,                 setCopiado]                 = useState(false)
    const [dragAtivo,               setDragAtivo]               = useState(false)

    const [enviando, setEnviando] = useState(false)
    const [feedback, setFeedback] = useState(null)

    const tituloRef    = useRef(null)
    const subtituloRef = useRef(null)
    const btnCamisaRef = useRef(null)

    const senhaOk = {
        especial:  /[^a-zA-Z0-9]/.test(form.senha),
        maiusculo: /[A-Z]/.test(form.senha),
        minimo8:   form.senha.length >= 8,
    }
    const senhaValida = senhaOk.especial && senhaOk.maiusculo && senhaOk.minimo8

    const avisoRaUnesp = form.email.toLowerCase().includes('@unesp') && !form.ra.trim()

    const [avisoMontado, setAvisoMontado] = useState(false)
    const [avisoVisivel, setAvisoVisivel] = useState(false)
    useEffect(() => {
        if (avisoRaUnesp) {
            setAvisoMontado(true)
            const id = requestAnimationFrame(() => setAvisoVisivel(true))
            return () => cancelAnimationFrame(id)
        }
        setAvisoVisivel(false)
        const id = setTimeout(() => setAvisoMontado(false), 300)
        return () => clearTimeout(id)
    }, [avisoRaUnesp])

    useEffect(() => {
        if (etapa !== 'ingresso') return
        setCarregandoIngressos(true)
        apiFetch(`${API_URL}/api/tipo-inscricao?ano=2026`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => setTiposIngresso(data.filter(t => t.ativo)))
            .catch(() => setFeedback({ tipo: 'erro', msg: 'Não foi possível carregar os tipos de ingresso.' }))
            .finally(() => setCarregandoIngressos(false))
    }, [etapa])

    function setField(campo, valor) {
        setForm(prev => ({ ...prev, [campo]: valor }))
    }

    function trocarAba(novaAba) {
        if (novaAba === aba) return
        setFeedback(null)
        setAbaSaindo(true)
        setTimeout(() => {
            setAba(novaAba)
            if (novaAba === 'inscricao') { setEtapa('dados'); setSubEtapaDados('identificacao') }
            setAbaSaindo(false)
        }, 200)
    }

    useEffect(() => {
        if (etapa !== 'comemoracao') return
        gsap.set(tituloRef.current,    { opacity: 0, y: -40, scale: 0.6 })
        gsap.set(subtituloRef.current, { opacity: 0, y: 20 })
        gsap.set(btnCamisaRef.current, { opacity: 0, y: 15 })
        gsap.to(tituloRef.current,    { opacity: 1, y: 0, scale: 1, duration: 0.7,  ease: 'back.out(1.7)', delay: 0.15 })
        gsap.to(subtituloRef.current, { opacity: 1, y: 0,           duration: 0.55, ease: 'power2.out',    delay: 0.55 })
        gsap.to(btnCamisaRef.current, { opacity: 1, y: 0,           duration: 0.45, ease: 'back.out(1.4)', delay: 1.6  })
    }, [etapa])

    function copiarChavePix() {
        navigator.clipboard.writeText(CHAVE_PIX).then(() => {
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2000)
        })
    }

    function handleArquivoComprovante(arquivo) {
        if (!arquivo) return
        setArquivoComprovante(arquivo)
        if (arquivo.type.startsWith('image/')) {
            setPreviewComprovante(URL.createObjectURL(arquivo))
        } else {
            setPreviewComprovante(null)
        }
    }

    async function handleSubmitEntrar(e) {
        e.preventDefault()
        setEnviando(true)
        setFeedback(null)
        try {
            const resposta = await apiFetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, senha: form.senha }),
            })
            if (resposta.ok) {
                const corpo = await resposta.json().catch(() => null)
                if (corpo?.token) salvarSessao(corpo)
                setFeedback({ tipo: 'sucesso', msg: 'Login efetuado com sucesso!' })
                if (rotaRetorno === '/financeiro') {
                    navigate(temAcessoFinanceiro() ? '/financeiro' : '/')
                } else if (rotaRetorno === '/admin') {
                    navigate(temAcessoAdmin() ? '/admin' : '/')
                }
            } else if (resposta.status === 401) {
                setFeedback({ tipo: 'erro', msg: 'E-mail ou senha inválidos.' })
            } else {
                setFeedback({ tipo: 'erro', msg: 'Erro ao entrar. Tente novamente.' })
            }
        } catch {
            setFeedback({ tipo: 'erro', msg: 'Não foi possível conectar ao servidor.' })
        } finally {
            setEnviando(false)
        }
    }

    async function handleSubmitComprovante(e) {
        e.preventDefault()
        if (!arquivoComprovante) return
        setEnviando(true)
        setFeedback(null)

        try {
            const respostaInscricao = await apiFetch(`${API_URL}/api/inscricao`, {
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

            if (respostaInscricao.status === 409) {
                const corpo = await respostaInscricao.json().catch(() => null)
                setFeedback({ tipo: 'erro', msg: corpo?.mensagem || 'CPF ou e-mail já cadastrado.' })
                return
            }
            if (!respostaInscricao.ok) {
                setFeedback({ tipo: 'erro', msg: 'Erro ao realizar inscrição. Tente novamente.' })
                return
            }

            const { uuid } = await respostaInscricao.json()

            const formData = new FormData()
            formData.append('arquivo', arquivoComprovante)
            await apiFetch(`${API_URL}/api/inscricao/${uuid}/comprovante`, {
                method: 'POST',
                body: formData,
                timeout: 60000, // upload de arquivo: janela maior que o padrão
            })

            setEtapa('sucesso')
        } catch {
            setFeedback({ tipo: 'erro', msg: 'Não foi possível conectar ao servidor.' })
        } finally {
            setEnviando(false)
        }
    }

    const passoUmConcluido   = etapa !== 'dados' && etapa !== 'comemoracao'
    const passoDoisConcluido = ETAPAS_APOS_CAMISA.includes(etapa)
    const passoTresConcluido = etapa === 'sucesso'

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
                <div className="logoSemacEntrar">
                    <img src={logoRaios} alt="logo semac"/>
                </div>

                {/* ── Formulário: Inscrever-se ──────────────────────── */}
                {aba === 'inscricao' && (
                    <>
                        {/* Indicador de progresso — 3 passos */}
                        {etapa !== 'comemoracao' && etapa !== 'sucesso' && (
                            <div class="indicadorEtapasInscricao">
                                <div class={`passoEtapaInscricao ${etapa === 'dados' ? 'passoEtapaInscricaoAtivo' : 'passoEtapaInscricaoConcluido'}`}>
                                    <span class="numeroEtapaInscricao">{passoUmConcluido ? '✓' : '1'}</span>
                                    <span class="nomeEtapaInscricao">Seus dados</span>
                                </div>
                                <span class="linhaEtapaInscricao" />
                                <div class={`passoEtapaInscricao ${etapa === 'camisa' ? 'passoEtapaInscricaoAtivo' : passoDoisConcluido ? 'passoEtapaInscricaoConcluido' : ''}`}>
                                    <span class="numeroEtapaInscricao">{passoDoisConcluido ? '✓' : '2'}</span>
                                    <span class="nomeEtapaInscricao">Camiseta</span>
                                </div>
                                <span class="linhaEtapaInscricao" />
                                <div class={`passoEtapaInscricao ${['ingresso', 'pix', 'comprovante'].includes(etapa) ? 'passoEtapaInscricaoAtivo' : passoTresConcluido ? 'passoEtapaInscricaoConcluido' : ''}`}>
                                    <span class="numeroEtapaInscricao">{passoTresConcluido ? '✓' : '3'}</span>
                                    <span class="nomeEtapaInscricao">Pagamento</span>
                                </div>
                            </div>
                        )}

                        {/* ── Etapa 1a: Identificação ──────────────── */}
                        {etapa === 'dados' && subEtapaDados === 'identificacao' && (
                            <form class="formularioInscricao" onSubmit={e => { e.preventDefault(); setSubEtapaDados('acesso') }}>
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
                                <button type="submit" class="botaoConfirmarInscricao">
                                    Próxima etapa
                                </button>
                            </form>
                        )}

                        {/* ── Etapa 1b: E-mail e senha ──────────────── */}
                        {etapa === 'dados' && subEtapaDados === 'acesso' && (
                            <form class="formularioInscricao" onSubmit={e => { e.preventDefault(); setEtapa('comemoracao') }}>
                                <CampoTexto
                                    label="E-mail"
                                    type="email"
                                    value={form.email}
                                    onInput={e => setField('email', e.target.value)}
                                    required
                                />
                                {avisoMontado && (
                                    <p class={`avisoRaUnespInscricao ${avisoVisivel ? 'avisoRaUnespInscricaoVisivel' : ''}`}>
                                        É muito importante que preencha o campo de RA, para que possamos gerar o seu certificado.
                                    </p>
                                )}
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
                            <form class="formularioInscricao" onSubmit={e => { e.preventDefault(); setFeedback(null); setEtapa('ingresso') }}>
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

                                <button type="submit" class="botaoConfirmarInscricao">
                                    Próxima etapa
                                </button>
                            </form>
                        )}

                        {/* ── Etapa 3a: Escolha do ingresso ────────── */}
                        {etapa === 'ingresso' && (
                            <div class="secaoIngressoInscricao formularioInscricao">
                                <span class="rotuloCampoInscricao">Tipo de Ingresso</span>
                                {carregandoIngressos ? (
                                    <p class="carregandoIngressosInscricao">Carregando...</p>
                                ) : (
                                    <div class="listaCardsIngressoInscricao">
                                        {tiposIngresso.map(tipo => (
                                            <button
                                                key={tipo.id}
                                                type="button"
                                                class={`cardIngressoInscricao ${tipoIngressoSelecionado?.id === tipo.id ? 'cardIngressoInscricaoSelecionado' : ''}`}
                                                onClick={() => setTipoIngressoSelecionado(tipo)}
                                            >
                                                <span class="nomeIngressoInscricao">{tipo.nome}</span>
                                                <span class="valorIngressoInscricao">
                                                    {Number(tipo.valor) === 0
                                                        ? <span class="labelGratisInscricao">Gratuito</span>
                                                        : formatarMoeda(tipo.valor)
                                                    }
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {feedback && (
                                    <p class={`feedbackInscricao feedbackInscricao${feedback.tipo.charAt(0).toUpperCase() + feedback.tipo.slice(1)}`}>{feedback.msg}</p>
                                )}
                                <button
                                    type="button"
                                    class="botaoConfirmarInscricao"
                                    disabled={!tipoIngressoSelecionado}
                                    onClick={() => { setFeedback(null); setEtapa('pix') }}
                                >
                                    Próxima etapa
                                </button>
                            </div>
                        )}

                        {/* ── Etapa 3b: Pagamento PIX ───────────────── */}
                        {etapa === 'pix' && (
                            <div class="secaoPixInscricao formularioInscricao">
                                <div class="resumoIngressoPixInscricao">
                                    <span>{tipoIngressoSelecionado?.nome}</span>
                                    <strong>{formatarMoeda(tipoIngressoSelecionado?.valor ?? 0)}</strong>
                                </div>

                                <div class="wrapperQrInscricao">
                                    <img src={qrCodePix} alt="QR Code PIX" class="imagemQrInscricao" />
                                </div>

                                <div class="blocoChavePixInscricao">
                                    <span class="rotuloChavePixInscricao">Chave PIX</span>
                                    <div class="linhaChavePixInscricao">
                                        <span class="valorChavePixInscricao">{CHAVE_PIX}</span>
                                        <button
                                            type="button"
                                            class={`botaoCopiarChaveInscricao ${copiado ? 'botaoCopiadoInscricao' : ''}`}
                                            onClick={copiarChavePix}
                                        >
                                            {copiado ? 'Copiado ✓' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>

                                <p class="avisoPixInscricao">
                                    Pague o valor exato de <strong>{formatarMoeda(tipoIngressoSelecionado?.valor ?? 0)}</strong> e guarde o comprovante.
                                </p>

                                <button
                                    type="button"
                                    class="botaoConfirmarInscricao"
                                    onClick={() => setEtapa('comprovante')}
                                >
                                    Já paguei → enviar comprovante
                                </button>
                            </div>
                        )}

                        {/* ── Etapa 3c: Upload do comprovante ──────── */}
                        {etapa === 'comprovante' && (
                            <form class="secaoComprovanteInscricao formularioInscricao" onSubmit={handleSubmitComprovante}>
                                <span class="rotuloCampoInscricao">Comprovante de Pagamento</span>

                                <div
                                    class={`zonaUploadInscricao ${dragAtivo ? 'zonaUploadAtivaInscricao' : ''} ${arquivoComprovante ? 'zonaUploadComArquivoInscricao' : ''}`}
                                    onClick={() => document.getElementById('inputComprovanteInscricao').click()}
                                    onDragOver={e => { e.preventDefault(); setDragAtivo(true) }}
                                    onDragLeave={() => setDragAtivo(false)}
                                    onDrop={e => {
                                        e.preventDefault()
                                        setDragAtivo(false)
                                        const arquivo = e.dataTransfer.files[0]
                                        if (arquivo) handleArquivoComprovante(arquivo)
                                    }}
                                >
                                    <input
                                        id="inputComprovanteInscricao"
                                        type="file"
                                        accept="image/*,application/pdf"
                                        style={{ display: 'none' }}
                                        onChange={e => handleArquivoComprovante(e.target.files[0])}
                                    />
                                    {arquivoComprovante ? (
                                        <div class="previewComprovanteInscricao">
                                            {previewComprovante
                                                ? <img src={previewComprovante} class="previewImagemInscricao" alt="Comprovante" />
                                                : <span class="iconeUploadInscricao">📄</span>
                                            }
                                            <span class="nomeArquivoInscricao">{arquivoComprovante.name}</span>
                                            <span class="botaoTrocarArquivoInscricao">Trocar arquivo</span>
                                        </div>
                                    ) : (
                                        <div class="placeholderUploadInscricao">
                                            <span class="iconeUploadInscricao">↑</span>
                                            <span class="textoUploadInscricao">Clique ou arraste o comprovante aqui</span>
                                            <span class="subTextoUploadInscricao">JPG, PNG ou PDF</span>
                                        </div>
                                    )}
                                </div>

                                {feedback && (
                                    <p class={`feedbackInscricao feedbackInscricao${feedback.tipo.charAt(0).toUpperCase() + feedback.tipo.slice(1)}`}>{feedback.msg}</p>
                                )}

                                <button type="submit" class="botaoConfirmarInscricao" disabled={enviando || !arquivoComprovante}>
                                    {enviando ? 'Enviando...' : 'Finalizar inscrição'}
                                </button>
                            </form>
                        )}

                        {/* ── Sucesso ───────────────────────────────── */}
                        {etapa === 'sucesso' && (
                            <div class="conteinerComemoracaoInscricao">
                                <div class="tituloComemoracaoInscricao">Inscrição enviada!</div>
                                <p class="subtituloComemoracaoInscricao">
                                    Confirmaremos seu pagamento em breve e você receberá um e-mail com a confirmação.
                                </p>
                            </div>
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
                        {feedback && (
                            <p class={`feedbackInscricao feedbackInscricao${feedback.tipo.charAt(0).toUpperCase() + feedback.tipo.slice(1)}`}>{feedback.msg}</p>
                        )}
                        <button type="submit" class="botaoConfirmarInscricao" disabled={enviando}>
                            {enviando ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

// ── Subcomponentes ──────────────────────────────────────────────

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

function Indicador({ ok, texto }) {
    return (
        <span class={`indicadorSenhaInscricao ${ok ? 'indicadorSenhaOkInscricao' : ''}`}>
            <span class="caixaIndicadorSenhaInscricao" />
            {texto}
        </span>
    )
}
