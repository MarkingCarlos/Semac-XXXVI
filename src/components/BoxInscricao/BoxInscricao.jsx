import { useState, useRef, useEffect } from 'preact/hooks'
import { useLocation } from 'wouter'
import { salvarSessao, temAcessoFinanceiro, temAcessoAdmin, temAcessoParticipante } from '../../auth/sessao.js'
import { apiFetch } from '../../lib/apiFetch.js'
import { criarPagamentoCartao } from './apiPagamento.js'
import { carregarMercadoPago } from './lib/carregarMercadoPago.js'
import './boxInscricao.css'
import logoRaios from '../../assets/logoSemacRaios.png'
import qrCodePix from '../../assets/qr.png'

const MERCADOPAGO_PUBLIC_KEY = import.meta.env.MERCADOPAGOKEY

/* Cadastro em quatro etapas. O ingresso escolhido na etapa 2 governa o
   resto do fluxo: ele diz quantas camisetas vêm inclusas e quanto há a
   pagar. Quando o total fecha em zero (ingresso gratuito, sem camiseta
   avulsa) a etapa de pagamento é pulada e o rótulo do passo 4 passa a
   ser "Confirmação".

   Ingressos, camisetas inclusas e preço da camiseta avulsa vêm todos do
   /admin (seção "Informações SEMAC") — nada disso é fixo aqui. */

function lerParametrosNavegacao() {
    const params = new URLSearchParams(window.location.search)
    return { tab: params.get('tab'), next: params.get('next') }
}

/* Rotas trancadas por temAcessoAdmin (ver main.jsx). As do financeiro sao
   reconhecidas pelo prefixo, porque tem subrotas. */
const ROTAS_ADMIN = ['/admin', '/sorteio', '/checkin']

/* Para onde o login leva a pessoa. O `next` da URL tem prioridade -- foi a
   rota que exigiu o login --, mas so quando o papel dela da acesso; caso
   contrario ela vai para a area natural do seu papel. Quem ainda nao tem
   papel (inscricao aguardando confirmacao) nao tem area nenhuma: devolve
   null e a pessoa fica na propria tela, com a mensagem de sucesso. */
function destinoPosLogin(rotaRetorno) {
    if (rotaRetorno) {
        if (rotaRetorno.startsWith('/financeiro') && temAcessoFinanceiro()) return rotaRetorno
        if (ROTAS_ADMIN.includes(rotaRetorno) && temAcessoAdmin())          return rotaRetorno
        if (rotaRetorno === '/participantes' && temAcessoParticipante())     return rotaRetorno
    }
    if (temAcessoAdmin())        return '/admin'
    if (temAcessoParticipante()) return '/participantes'
    return null
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const CHAVE_PIX = 'apoio@semac.cc'

/* Mesma edição usada pelo /admin ao cadastrar os ingressos. */
const ANO_EDICAO = new Date().getFullYear()

const MODELOS  = ['BABY_LOOK', 'NORMAL']
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG']
const LABEL_MODELO = { BABY_LOOK: 'Baby Look', NORMAL: 'Normal' }

/* Largura × altura em centímetros, por modelagem — tabela do fornecedor
   (Studio Uniformes Ariart). Serve tanto à tabela completa quanto à
   medida exibida abaixo do tamanho selecionado. */
const MEDIDAS_CAMISETA = {
    BABY_LOOK: { PP: [37, 54], P: [39, 56], M: [43, 60], G: [46, 63], GG: [47, 63], XG: [51, 66], XXG: [53, 69] },
    NORMAL:    { PP: [49, 63], P: [52, 66], M: [54, 70], G: [57, 72], GG: [61, 75], XG: [64, 79], XXG: [68, 82] },
}

const CAMISETA_PADRAO = { modelo: 'NORMAL', tamanho: 'M' }

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

function textoMedidas(camiseta) {
    const [largura, altura] = MEDIDAS_CAMISETA[camiseta.modelo][camiseta.tamanho]
    return `Largura × altura: ${largura} × ${altura} cm`
}

function plural(quantidade, umaForma, variasFormas) {
    return quantidade === 1 ? umaForma : variasFormas
}

export default function BoxInscricao() {
    const [, navigate] = useLocation()
    const { tab: tabInicial, next: rotaRetorno } = lerParametrosNavegacao()

    const [aba,       setAba]       = useState(tabInicial === 'entrar' ? 'entrar' : 'inscricao')
    const [abaSaindo, setAbaSaindo] = useState(false)
    const [etapa,     setEtapa]     = useState(1)

    /* A etapa 1 é dividida em duas telas: quem você é, depois como você
       entra. Mantém os campos por assunto e o formulário curto. */
    const [subEtapaDados, setSubEtapaDados] = useState('identificacao')

    const [form, setForm] = useState({ nome: '', cpf: '', ra: '', email: '', senha: '' })

    const [ingressos,           setIngressos]           = useState([])
    const [carregandoIngressos, setCarregandoIngressos] = useState(false)
    const [ingresso,            setIngresso]            = useState(null)
    const [dias,                setDias]                = useState(1)

    /* Uma única escolha de camiseta grátis, replicada na hora de enviar:
       quem tem direito a mais de uma recebe todas iguais. */
    const [camisetaGratis,     setCamisetaGratis]     = useState(CAMISETA_PADRAO)
    const [camisetasExtras,    setCamisetasExtras]    = useState([])
    const [precoCamisetaExtra, setPrecoCamisetaExtra] = useState(0)

    const [arquivoComprovante, setArquivoComprovante] = useState(null)
    const [previewComprovante, setPreviewComprovante] = useState(null)
    const [copiado,            setCopiado]            = useState(false)
    const [dragAtivo,          setDragAtivo]          = useState(false)

    /* Pix ou cartão, escolhidos na etapa de pagamento. O uuid da pessoa
       fica em cache assim que criado (garantirPessoaCriada) pra não
       recadastrar em cada nova tentativa de pagamento -- o cartão pode
       ser recusado e a pessoa tentar de novo (outro cartão, ou Pix). */
    const [formaPagamento,          setFormaPagamento]          = useState('pix')
    const [uuidCriado,              setUuidCriado]              = useState(null)
    const [brickCartaoPronto,       setBrickCartaoPronto]       = useState(false)
    const [processandoPagamento,    setProcessandoPagamento]    = useState(false)
    const [resultadoPagamentoCartao, setResultadoPagamentoCartao] = useState(null)

    const [enviando, setEnviando] = useState(false)
    const [feedback, setFeedback] = useState(null)

    const inputComprovanteRef = useRef(null)
    const brickContainerRef   = useRef(null)
    const brickControllerRef  = useRef(null)

    const senhaOk = {
        especial:  /[^a-zA-Z0-9]/.test(form.senha),
        maiusculo: /[A-Z]/.test(form.senha),
        minimo8:   form.senha.length >= 8,
    }
    const senhaValida = senhaOk.especial && senhaOk.maiusculo && senhaOk.minimo8

    const identificacaoValida = form.nome.trim() && form.cpf.replace(/\D/g, '').length === 11
    const acessoValido = form.email.trim() && senhaValida

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

    /* Ingressos e preço da camiseta avulsa são carregados juntos ao entrar
       na etapa 2: a etapa 3 já precisa do preço para montar a oferta. */
    useEffect(() => {
        if (aba !== 'inscricao' || etapa !== 2 || ingressos.length > 0) return
        setCarregandoIngressos(true)
        Promise.all([
            apiFetch(`${API_URL}/api/tipo-inscricao?ano=${ANO_EDICAO}`)
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(lista => setIngressos(lista.filter(tipo => tipo.ativo))),
            apiFetch(`${API_URL}/api/camiseta-extra?ano=${ANO_EDICAO}`)
                .then(r => r.ok ? r.json() : Promise.reject())
                .then(preco => setPrecoCamisetaExtra(Number(preco.valor) || 0)),
        ])
            .catch(() => setFeedback({ tipo: 'erro', msg: 'Não foi possível carregar os ingressos.' }))
            .finally(() => setCarregandoIngressos(false))
    }, [aba, etapa, ingressos.length])

    /* Monta o Card Payment Brick quando a pessoa abre a aba "Cartão" na
       etapa de pagamento; desmonta ao sair da etapa ou trocar pra Pix, pra
       não deixar dois brickss vivos. Sem chave pública configurada a aba
       fica oculta (ver render mais abaixo) e este efeito nem chega a rodar. */
    useEffect(() => {
        if (etapa !== 4 || formaPagamento !== 'cartao' || !MERCADOPAGO_PUBLIC_KEY) return

        let cancelado = false
        setBrickCartaoPronto(false)

        carregarMercadoPago()
            .then(MercadoPago => {
                if (cancelado || !brickContainerRef.current) return null
                const mp = new MercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' })
                return mp.bricks().create('cardPayment', brickContainerRef.current.id, {
                    initialization: { amount: total },
                    callbacks: {
                        // onReady é obrigatório pro SDK (mesmo com onError presente) --
                        // sem ele, bricks().create() rejeita com "Callbacks onReady
                        // and/or onError are required" e o brick nunca aparece.
                        onReady: () => { if (!cancelado) setBrickCartaoPronto(true) },
                        onSubmit: onSubmitBrickCartao,
                        onError: erro => setFeedback({
                            tipo: 'erro',
                            msg: erro?.message || 'Não foi possível validar os dados do cartão.',
                        }),
                    },
                })
            })
            .then(controller => {
                if (!controller) return
                if (cancelado) { controller.unmount(); return }
                brickControllerRef.current = controller
            })
            .catch(() => setFeedback({
                tipo: 'erro',
                msg: 'Não foi possível carregar o pagamento por cartão. Tente o Pix.',
            }))

        return () => {
            cancelado = true
            brickControllerRef.current?.unmount()
            brickControllerRef.current = null
        }
    }, [etapa, formaPagamento])

    /* ── Valores ─────────────────────────────────────────────────── */

    const camisetasInclusas = ingresso?.camisetasGratis ?? 0

    const valorIngresso = !ingresso ? 0
        : ingresso.porDia ? Number(ingresso.valor) * dias : Number(ingresso.valor)
    const valorExtras = camisetasExtras.length * precoCamisetaExtra
    const total = valorIngresso + valorExtras

    /* Linhas do resumo — as mesmas no pagamento e na confirmação. */
    function linhasResumo() {
        const linhas = []
        if (ingresso) {
            linhas.push({
                rotulo: ingresso.porDia
                    ? `${ingresso.nome} × ${dias} ${plural(dias, 'dia', 'dias')}`
                    : ingresso.nome,
                valor: valorIngresso > 0 ? formatarMoeda(valorIngresso) : 'Gratuito',
                inclusa: valorIngresso === 0,
            })
        }
        if (camisetasInclusas > 0) {
            linhas.push({
                rotulo: `${camisetasInclusas} ${plural(camisetasInclusas, 'camiseta grátis', 'camisetas grátis')}`
                    + ` · ${LABEL_MODELO[camisetaGratis.modelo]} ${camisetaGratis.tamanho}`,
                valor: plural(camisetasInclusas, 'Inclusa', 'Inclusas'),
                inclusa: true,
            })
        }
        camisetasExtras.forEach(camiseta => linhas.push({
            rotulo: `Camiseta avulsa · ${LABEL_MODELO[camiseta.modelo]} ${camiseta.tamanho}`,
            valor: formatarMoeda(precoCamisetaExtra),
            inclusa: false,
        }))
        return linhas
    }

    /* ── Navegação entre etapas ──────────────────────────────────── */

    function setField(campo, valor) {
        setForm(prev => ({ ...prev, [campo]: valor }))
    }

    function trocarAba(novaAba) {
        if (novaAba === aba) return
        setFeedback(null)
        setAbaSaindo(true)
        setTimeout(() => {
            setAba(novaAba)
            if (novaAba === 'inscricao') { setEtapa(1); setSubEtapaDados('identificacao') }
            setAbaSaindo(false)
        }, 200)
    }

    function selecionarIngresso(tipo) {
        if (ingresso?.id === tipo.id) return
        setIngresso(tipo)
        setDias(1)
        setCamisetasExtras([])
        setCamisetaGratis(CAMISETA_PADRAO)
    }

    function voltarEtapa() {
        setFeedback(null)
        // Voltando da etapa 2, a etapa 1 reabre na última tela vista.
        setSubEtapaDados('acesso')
        setEtapa(atual => Math.max(1, atual - 1))
    }

    /* Sem nada a pagar, a etapa 4 não existe: a inscrição fecha aqui. */
    function avancarDaCamiseta() {
        if (total > 0) {
            setFeedback(null)
            setEtapa(4)
            return
        }
        finalizarInscricao()
    }

    function adicionarCamisetaExtra() {
        setCamisetasExtras(atuais => [...atuais, { ...CAMISETA_PADRAO }])
    }

    function removerCamisetaExtra(indice) {
        setCamisetasExtras(atuais => atuais.filter((_, i) => i !== indice))
    }

    function alterarCamisetaExtra(indice, mudanca) {
        setCamisetasExtras(atuais => atuais.map(
            (camiseta, i) => i === indice ? { ...camiseta, ...mudanca } : camiseta
        ))
    }

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

    /* ── Envio ───────────────────────────────────────────────────── */

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
                const destino = destinoPosLogin(rotaRetorno)
                if (destino) navigate(destino)
            } else {
                /* 403 = senha certa, mas a conta ainda não pode entrar (inscrição
                   em validação ou acesso suspenso). O motivo vem em `mensagem`. */
                const corpo = await resposta.json().catch(() => null)
                setFeedback({
                    tipo: 'erro',
                    msg: corpo?.mensagem
                        || (resposta.status === 401
                            ? 'E-mail ou senha inválidos.'
                            : 'Erro ao entrar. Tente novamente.'),
                })
            }
        } catch {
            setFeedback({ tipo: 'erro', msg: 'Não foi possível conectar ao servidor.' })
        } finally {
            setEnviando(false)
        }
    }

    /* Cria a pessoa com o ingresso e as camisetas escolhidas -- só na
       primeira chamada; tentativas seguintes (cartão recusado, troca pra
       Pix) reaproveitam o uuid já criado em vez de recadastrar, o que
       bateria no 409 de e-mail/CPF duplicado. Lança um Error com mensagem
       amigável em qualquer falha (HTTP ou de rede) para o chamador exibir. */
    async function garantirPessoaCriada() {
        if (uuidCriado) return uuidCriado

        const camisetas = [
            ...Array.from({ length: camisetasInclusas }, () => ({ ...camisetaGratis })),
            ...camisetasExtras,
        ]

        const respostaInscricao = await apiFetch(`${API_URL}/api/inscricao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome:            form.nome,
                cpf:             form.cpf.replace(/\D/g, ''),
                ra:              form.ra || null,
                email:           form.email,
                senha:           form.senha,
                tipoInscricaoId: ingresso.id,
                dias:            ingresso.porDia ? dias : null,
                camisetas,
            }),
        })

        if (respostaInscricao.status === 409) {
            const corpo = await respostaInscricao.json().catch(() => null)
            throw new Error(corpo?.mensagem || 'CPF ou e-mail já cadastrado.')
        }
        if (!respostaInscricao.ok) {
            const corpo = await respostaInscricao.json().catch(() => null)
            throw new Error(corpo?.mensagem || 'Erro ao realizar inscrição. Tente novamente.')
        }

        const { uuid } = await respostaInscricao.json()
        setUuidCriado(uuid)
        return uuid
    }

    /* Fluxo Pix: garante a pessoa criada, sobe o comprovante e fecha em
       etapa(5). O resultado do cartão (quando é essa a forma escolhida)
       segue seu próprio caminho, ver onSubmitBrickCartao mais abaixo. */
    async function finalizarInscricao() {
        if (total > 0 && !arquivoComprovante) return
        setEnviando(true)
        setFeedback(null)
        try {
            const uuid = await garantirPessoaCriada()

            if (arquivoComprovante) {
                const formData = new FormData()
                formData.append('arquivo', arquivoComprovante)
                await apiFetch(`${API_URL}/api/inscricao/${uuid}/comprovante`, {
                    method: 'POST',
                    body: formData,
                    timeout: 60000, // upload de arquivo: janela maior que o padrão
                })
            }

            setEtapa(5)
        } catch (erro) {
            setFeedback({
                tipo: 'erro',
                msg: erro instanceof TypeError ? 'Não foi possível conectar ao servidor.' : erro.message,
            })
        } finally {
            setEnviando(false)
        }
    }

    /* Envio do Card Payment Brick: tokenizou no navegador, agora garante a
       pessoa criada e cobra o cartão. Qualquer status devolvido (aprovado,
       recusado, em análise) segue para a etapa 5 -- a confirmação da
       inscrição continua manual no /admin de qualquer forma, então não há
       motivo pra travar a pessoa aqui num cartão recusado; ela já viu o
       resultado e pode tentar de novo ou trocar pra Pix se quiser. */
    async function onSubmitBrickCartao(dadosFormulario) {
        setProcessandoPagamento(true)
        setFeedback(null)
        try {
            const uuid = await garantirPessoaCriada()
            const resultado = await criarPagamentoCartao({
                pessoaUuid:      uuid,
                token:           dadosFormulario.token,
                paymentMethodId: dadosFormulario.payment_method_id,
                issuerId:        dadosFormulario.issuer_id,
                installments:    dadosFormulario.installments,
                payerEmail:      dadosFormulario.payer.email,
                payerCpf:        dadosFormulario.payer.identification.number,
            })
            setResultadoPagamentoCartao(resultado)
            setEtapa(5)
        } catch (erro) {
            setFeedback({
                tipo: 'erro',
                msg: erro instanceof TypeError ? 'Não foi possível conectar ao servidor.' : erro.message,
            })
            throw erro // o Brick espera a promise rejeitada pra destravar o botão de envio
        } finally {
            setProcessandoPagamento(false)
        }
    }

    /* ── Render ──────────────────────────────────────────────────── */

    const etapas = [
        { numero: 1, nome: 'Seus dados' },
        { numero: 2, nome: 'Ingresso' },
        { numero: 3, nome: 'Camiseta' },
        { numero: 4, nome: total > 0 || !ingresso ? 'Pagamento' : 'Confirmação' },
    ]

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
                <div class="logoSemacEntrar">
                    <img src={logoRaios} alt="SEMAC XXXVI — Semana Acadêmica da Computação" />
                </div>

                {/* ── Formulário: Inscrever-se ──────────────────────── */}
                {aba === 'inscricao' && (
                    <>
                        {etapa < 5 && (
                            <div class="indicadorEtapasInscricao">
                                {etapas.map((passo, indice) => (
                                    <div
                                        key={passo.numero}
                                        class={`grupoEtapaInscricao ${
                                            etapa === passo.numero ? 'passoEtapaInscricaoAtivo'
                                                : etapa > passo.numero ? 'passoEtapaInscricaoConcluido' : ''
                                        }`}
                                    >
                                        {indice > 0 && <span class="linhaEtapaInscricao" />}
                                        <div class="passoEtapaInscricao">
                                            <span class="numeroEtapaInscricao">
                                                {etapa > passo.numero ? '✓' : passo.numero}
                                            </span>
                                            <span class="nomeEtapaInscricao">{passo.nome}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Etapa 1a: Identificação ──────────────── */}
                        {etapa === 1 && subEtapaDados === 'identificacao' && (
                            <form
                                class="formularioInscricao"
                                onSubmit={e => { e.preventDefault(); setFeedback(null); setSubEtapaDados('acesso') }}
                            >
                                <CampoTexto
                                    label="Nome completo"
                                    value={form.nome}
                                    onInput={e => setField('nome', e.target.value)}
                                    required
                                />
                                <div class="gradeCamposDadosInscricao">
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
                                <button type="submit" class="botaoConfirmarInscricao" disabled={!identificacaoValida}>
                                    Próxima etapa
                                </button>
                            </form>
                        )}

                        {/* ── Etapa 1b: E-mail e senha ─────────────── */}
                        {etapa === 1 && subEtapaDados === 'acesso' && (
                            <form
                                class="formularioInscricao"
                                onSubmit={e => { e.preventDefault(); setFeedback(null); setEtapa(2) }}
                            >
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
                                <div class="acoesEtapaInscricao">
                                    <button
                                        type="button"
                                        class="botaoVoltarEtapaInscricao"
                                        onClick={() => setSubEtapaDados('identificacao')}
                                    >
                                        ← Voltar
                                    </button>
                                    <button type="submit" class="botaoConfirmarInscricao" disabled={!acessoValido}>
                                        Próxima etapa
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ── Etapa 2: Ingresso ────────────────────── */}
                        {etapa === 2 && (
                            <div class="formularioInscricao">
                                <div class="cabecalhoEtapaInscricao">
                                    <h2 class="tituloEtapaInscricao">Escolha seu ingresso</h2>
                                    <p class="subtituloEtapaInscricao">
                                        O ingresso define se você leva camiseta sem pagar nada a mais.
                                    </p>
                                </div>

                                {carregandoIngressos ? (
                                    <p class="carregandoIngressosInscricao">Carregando ingressos…</p>
                                ) : ingressos.length === 0 ? (
                                    <p class="carregandoIngressosInscricao">
                                        Nenhum ingresso disponível no momento.
                                    </p>
                                ) : (
                                    <div class="listaCardsIngressoInscricao" role="radiogroup" aria-label="Tipo de ingresso">
                                        {ingressos.map(tipo => (
                                            <CardIngresso
                                                key={tipo.id}
                                                tipo={tipo}
                                                selecionado={ingresso?.id === tipo.id}
                                                dias={dias}
                                                aoSelecionar={() => selecionarIngresso(tipo)}
                                                aoEscolherDias={setDias}
                                            />
                                        ))}
                                    </div>
                                )}

                                {feedback && <Feedback feedback={feedback} />}

                                <div class="acoesEtapaInscricao">
                                    <button type="button" class="botaoVoltarEtapaInscricao" onClick={voltarEtapa}>
                                        ← Voltar
                                    </button>
                                    <button
                                        type="button"
                                        class="botaoConfirmarInscricao"
                                        disabled={!ingresso}
                                        onClick={() => { setFeedback(null); setEtapa(3) }}
                                    >
                                        Próxima etapa
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Etapa 3: Camiseta ────────────────────── */}
                        {etapa === 3 && (
                            <div class="formularioInscricao">
                                <div class="cabecalhoEtapaInscricao">
                                    <h2 class="tituloEtapaInscricao">Camiseta</h2>
                                    <p class="subtituloEtapaInscricao">
                                        {camisetasInclusas === 0
                                            ? 'Seu ingresso não inclui camiseta — comprar é opcional.'
                                            : camisetasInclusas === 1
                                                ? 'Escolha a modelagem e o tamanho da sua camiseta grátis.'
                                                : `Você recebe ${camisetasInclusas} camisetas iguais: escolha modelagem e tamanho uma vez só.`}
                                    </p>
                                </div>

                                <div class="gradeCamisetaInscricao">
                                    <div class="colunaEditoresCamisetaInscricao">
                                        {camisetasInclusas > 0 && (
                                            <EditorCamiseta
                                                etiqueta={camisetasInclusas === 1
                                                    ? 'Camiseta grátis'
                                                    : `${camisetasInclusas} camisetas grátis · mesmo modelo`}
                                                destacada
                                                camiseta={camisetaGratis}
                                                aoMudar={mudanca => setCamisetaGratis(atual => ({ ...atual, ...mudanca }))}
                                            />
                                        )}

                                        {camisetasExtras.map((camiseta, indice) => (
                                            <EditorCamiseta
                                                key={indice}
                                                etiqueta={`Camiseta avulsa · ${formatarMoeda(precoCamisetaExtra)}`}
                                                camiseta={camiseta}
                                                aoMudar={mudanca => alterarCamisetaExtra(indice, mudanca)}
                                                aoRemover={() => removerCamisetaExtra(indice)}
                                            />
                                        ))}

                                        <div class="blocoOfertaCamisetaExtraInscricao">
                                            <span class="tituloOfertaCamisetaExtraInscricao">
                                                {camisetasInclusas === 0 ? 'Leve a camiseta oficial' : 'Quer mais uma?'}
                                            </span>
                                            <span class="textoOfertaCamisetaExtraInscricao">
                                                {camisetasInclusas === 0
                                                    ? `A camiseta oficial da SEMAC XXXVI sai por ${formatarMoeda(precoCamisetaExtra)}.`
                                                    : `Camisetas adicionais custam ${formatarMoeda(precoCamisetaExtra)} cada.`}
                                            </span>
                                            <button
                                                type="button"
                                                class="botaoAdicionarCamisetaInscricao"
                                                onClick={adicionarCamisetaExtra}
                                            >
                                                + Adicionar camiseta
                                            </button>
                                        </div>
                                    </div>

                                    <TabelaMedidasCamiseta />
                                </div>

                                <div class="linhaTotalCamisetaInscricao">
                                    <span class="rotuloTotalInscricao">Total</span>
                                    <span class="valorTotalInscricao">
                                        {total > 0 ? formatarMoeda(total) : 'Gratuito'}
                                    </span>
                                </div>

                                {feedback && <Feedback feedback={feedback} />}

                                <div class="acoesEtapaInscricao">
                                    <button type="button" class="botaoVoltarEtapaInscricao" onClick={voltarEtapa}>
                                        ← Voltar
                                    </button>
                                    <button
                                        type="button"
                                        class="botaoConfirmarInscricao"
                                        disabled={enviando}
                                        onClick={avancarDaCamiseta}
                                    >
                                        {enviando ? 'Enviando…'
                                            : total > 0 ? 'Ir para o pagamento' : 'Finalizar inscrição'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Etapa 4: Pagamento ───────────────────── */}
                        {etapa === 4 && (
                            <div class="formularioInscricao">
                                <div class="cabecalhoEtapaInscricao">
                                    <h2 class="tituloEtapaInscricao">Pagamento</h2>
                                    <p class="subtituloEtapaInscricao">
                                        {formaPagamento === 'cartao'
                                            ? 'Pague no cartão de crédito, em até 12x, direto por aqui.'
                                            : 'Pague por PIX e envie o comprovante para confirmarmos sua inscrição.'}
                                    </p>
                                </div>

                                <ResumoInscricao linhas={linhasResumo()} total={total} />

                                {MERCADOPAGO_PUBLIC_KEY && (
                                    <div class="alternadorFormaPagamentoInscricao" role="tablist" aria-label="Forma de pagamento">
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={formaPagamento === 'pix'}
                                            class={`opcaoFormaPagamentoInscricao ${formaPagamento === 'pix' ? 'opcaoFormaPagamentoInscricaoAtiva' : ''}`}
                                            onClick={() => { setFeedback(null); setFormaPagamento('pix') }}
                                        >
                                            Pix
                                        </button>
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={formaPagamento === 'cartao'}
                                            class={`opcaoFormaPagamentoInscricao ${formaPagamento === 'cartao' ? 'opcaoFormaPagamentoInscricaoAtiva' : ''}`}
                                            onClick={() => { setFeedback(null); setFormaPagamento('cartao') }}
                                        >
                                            Cartão de crédito
                                        </button>
                                    </div>
                                )}

                                {formaPagamento === 'cartao' ? (
                                    <div class="blocoCartaoInscricao">
                                        {!brickCartaoPronto && (
                                            <p class="carregandoBrickCartaoInscricao">Carregando formulário de cartão…</p>
                                        )}
                                        <div id="cardPaymentBrickContainerInscricao" class="containerBrickCartaoInscricao" ref={brickContainerRef} />
                                        {processandoPagamento && (
                                            <p class="carregandoBrickCartaoInscricao">Processando pagamento…</p>
                                        )}
                                    </div>
                                ) : (
                                    <div class="gradePagamentoInscricao">
                                        <div class="blocoPixInscricao">
                                            <span class="rotuloChavePixInscricao">QR Code PIX</span>
                                            <div class="wrapperQrInscricao">
                                                <img src={qrCodePix} alt="QR Code PIX" class="imagemQrInscricao" />
                                            </div>
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

                                        <div class="blocoComprovanteInscricao">
                                            <span class="rotuloCampoInscricao">Comprovante de pagamento</span>
                                            <div
                                                class={`zonaUploadInscricao ${dragAtivo ? 'zonaUploadAtivaInscricao' : ''} ${arquivoComprovante ? 'zonaUploadComArquivoInscricao' : ''}`}
                                                onClick={() => inputComprovanteRef.current?.click()}
                                                onDragOver={e => { e.preventDefault(); setDragAtivo(true) }}
                                                onDragLeave={() => setDragAtivo(false)}
                                                onDrop={e => {
                                                    e.preventDefault()
                                                    setDragAtivo(false)
                                                    handleArquivoComprovante(e.dataTransfer.files[0])
                                                }}
                                            >
                                                <input
                                                    ref={inputComprovanteRef}
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
                                            <p class="avisoPixInscricao">
                                                Pague o valor exato de <strong>{formatarMoeda(total)}</strong> e guarde o comprovante.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {feedback && <Feedback feedback={feedback} />}

                                <div class="acoesEtapaInscricao">
                                    <button
                                        type="button"
                                        class="botaoVoltarEtapaInscricao"
                                        onClick={voltarEtapa}
                                        disabled={!!uuidCriado}
                                        title={uuidCriado
                                            ? 'Sua inscrição já foi registrada com essas escolhas — não é mais possível trocar o ingresso ou a camiseta.'
                                            : undefined}
                                    >
                                        ← Voltar
                                    </button>
                                    {formaPagamento === 'pix' && (
                                        <button
                                            type="button"
                                            class="botaoConfirmarInscricao"
                                            disabled={enviando || !arquivoComprovante}
                                            onClick={finalizarInscricao}
                                        >
                                            {enviando ? 'Enviando…' : 'Finalizar inscrição'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Etapa 5: Confirmação ─────────────────── */}
                        {etapa === 5 && (
                            <div class="conteinerComemoracaoInscricao">
                                <span class="seloConfirmacaoInscricao">✓</span>
                                <div class="tituloComemoracaoInscricao">Inscrição enviada!</div>
                                {resultadoPagamentoCartao && (
                                    <p class="subtituloComemoracaoInscricao">
                                        {resultadoPagamentoCartao.status === 'approved'
                                            ? 'Pagamento aprovado, logo a comissão irá liberar seu acesso à plataforma.'
                                            : 'Recebemos os dados do pagamento e vamos confirmar em breve.'}
                                    </p>
                                )}
                                <p class="subtituloComemoracaoInscricao">
                                    {camisetasInclusas > 0 || camisetasExtras.length > 0
                                        ? 'Sua camiseta chega junto com o kit SEMAC no primeiro dia do evento. \n Em breve iremos liberar seu acesso à plataforma.'
                                        : 'Confirmaremos os dados em breve e você receberá um e-mail.'}
                                </p>
                                <ResumoInscricao linhas={linhasResumo()} total={total} />
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
                            permitirVerSenha
                            required
                        />
                        {feedback && <Feedback feedback={feedback} />}
                        <button type="submit" class="botaoConfirmarInscricao" disabled={enviando}>
                            {enviando ? 'Entrando…' : 'Entrar'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

// ── Subcomponentes ──────────────────────────────────────────────

/* Card de ingresso. O direito a camiseta fica à vista antes da escolha —
   é a informação que decide o resto do fluxo. O seletor de diárias só
   aparece dentro do card selecionado, para não poluir a lista. */
function CardIngresso({ tipo, selecionado, dias, aoSelecionar, aoEscolherDias }) {
    const gratuito = Number(tipo.valor) === 0
    const inclusas = tipo.camisetasGratis ?? 0
    const maximoDias = tipo.maxDias ?? 1

    return (
        <div
            class={`cardIngressoInscricao ${selecionado ? 'cardIngressoInscricaoSelecionado' : ''}`}
            role="radio"
            aria-checked={selecionado}
            tabIndex={0}
            onClick={aoSelecionar}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoSelecionar() }
            }}
        >
            <div class="topoCardIngressoInscricao">
                <span class="nomeIngressoInscricao">{tipo.nome}</span>
                <span class="valorIngressoInscricao">
                    {gratuito
                        ? <span class="labelGratisInscricao">Gratuito</span>
                        : <>{formatarMoeda(tipo.valor)}{tipo.porDia && <span class="sufixoDiariaInscricao"> / dia</span>}</>
                    }
                </span>
            </div>

            <span class={`camisetaIngressoInscricao ${inclusas > 0 ? 'camisetaIngressoInclusaInscricao' : ''}`}>
                {inclusas === 0
                    ? 'Kit SEMAC não incluso.'
                    : 'Kit SEMAC incluso.'}
            </span>

            {selecionado && tipo.porDia && (
                <div class="blocoDiariasIngressoInscricao">
                    <span class="rotuloDiariasIngressoInscricao">Quantas diárias?</span>
                    <div class="listaDiariasIngressoInscricao">
                        {Array.from({ length: maximoDias }, (_, i) => i + 1).map(quantidade => (
                            <button
                                key={quantidade}
                                type="button"
                                class={`botaoDiariaIngressoInscricao ${dias === quantidade ? 'botaoDiariaIngressoInscricaoAtivo' : ''}`}
                                aria-pressed={dias === quantidade}
                                onClick={e => { e.stopPropagation(); aoEscolherDias(quantidade) }}
                            >
                                {quantidade}
                            </button>
                        ))}
                    </div>
                    <span class="totalDiariasIngressoInscricao">
                        Total do ingresso: {formatarMoeda(Number(tipo.valor) * dias)}
                    </span>
                </div>
            )}
        </div>
    )
}

/* Editor de uma camiseta: modelagem, tamanho e a medida do tamanho ativo.
   `destacada` marca a que veio inclusa no ingresso; `aoRemover` só existe
   nas avulsas. */
function EditorCamiseta({ etiqueta, destacada, camiseta, aoMudar, aoRemover }) {
    return (
        <div class={`editorCamisetaInscricao ${destacada ? 'editorCamisetaGratisInscricao' : ''}`}>
            <div class="topoEditorCamisetaInscricao">
                <span class={`etiquetaEditorCamisetaInscricao ${destacada ? 'etiquetaCamisetaGratisInscricao' : ''}`}>
                    {etiqueta}
                </span>
                {aoRemover && (
                    <button type="button" class="botaoRemoverCamisetaInscricao" onClick={aoRemover}>
                        Remover
                    </button>
                )}
            </div>

            <span class="rotuloOpcaoCamisetaInscricao">Modelagem</span>
            <div class="modelosCamisaInscricao">
                {MODELOS.map(modelo => (
                    <button
                        key={modelo}
                        type="button"
                        class={`botaoModeloInscricao ${camiseta.modelo === modelo ? 'botaoModeloInscricaoAtivo' : ''}`}
                        aria-pressed={camiseta.modelo === modelo}
                        onClick={() => aoMudar({ modelo })}
                    >
                        {LABEL_MODELO[modelo]}
                    </button>
                ))}
            </div>

            <span class="rotuloOpcaoCamisetaInscricao">Tamanho</span>
            <div class="tamanhosCamisaInscricao">
                {TAMANHOS.map(tamanho => (
                    <button
                        key={tamanho}
                        type="button"
                        class={`botaoTamanhoInscricao ${camiseta.tamanho === tamanho ? 'botaoTamanhoInscricaoAtivo' : ''}`}
                        aria-pressed={camiseta.tamanho === tamanho}
                        onClick={() => aoMudar({ tamanho })}
                    >
                        {tamanho}
                    </button>
                ))}
            </div>

            <span class="medidaCamisetaInscricao">{textoMedidas(camiseta)}</span>
        </div>
    )
}

function TabelaMedidasCamiseta() {
    return (
        <aside class="tabelaMedidasCamisetaInscricao">
            <div class="cabecalhoTabelaMedidasInscricao">
                <h3 class="tituloTabelaMedidasInscricao">Tabela de medidas</h3>
                <span class="notaTabelaMedidasInscricao">Em centímetros · Studio Uniformes Ariart</span>
            </div>
            {MODELOS.map(modelo => (
                <div class="blocoModeloMedidasInscricao" key={modelo}>
                    <span class="tituloModeloMedidasInscricao">{LABEL_MODELO[modelo]}</span>
                    <div class="gradeMedidasInscricao">
                        <span class="cabecalhoColunaMedidasInscricao">Tam.</span>
                        <span class="cabecalhoColunaMedidasInscricao">Larg.</span>
                        <span class="cabecalhoColunaMedidasInscricao">Alt.</span>
                        {TAMANHOS.flatMap(tamanho => [
                            <span class="tamanhoMedidasInscricao" key={`tam${modelo}${tamanho}`}>{tamanho}</span>,
                            <span key={`larg${modelo}${tamanho}`}>{MEDIDAS_CAMISETA[modelo][tamanho][0]}</span>,
                            <span key={`alt${modelo}${tamanho}`}>{MEDIDAS_CAMISETA[modelo][tamanho][1]}</span>,
                        ])}
                    </div>
                </div>
            ))}
        </aside>
    )
}

function ResumoInscricao({ linhas, total }) {
    return (
        <div class="resumoInscricao">
            {linhas.map((linha, indice) => (
                <div class="linhaResumoInscricao" key={indice}>
                    <span class="rotuloResumoInscricao">{linha.rotulo}</span>
                    <span class={`valorResumoInscricao ${linha.inclusa ? 'valorResumoInclusoInscricao' : ''}`}>
                        {linha.valor}
                    </span>
                </div>
            ))}
            <span class="divisorResumoInscricao" />
            <div class="linhaResumoInscricao">
                <span class="rotuloTotalInscricao">Total</span>
                <span class="valorTotalInscricao">{total > 0 ? formatarMoeda(total) : 'Gratuito'}</span>
            </div>
        </div>
    )
}

function Feedback({ feedback }) {
    const sufixo = feedback.tipo.charAt(0).toUpperCase() + feedback.tipo.slice(1)
    return <p class={`feedbackInscricao feedbackInscricao${sufixo}`} role="status">{feedback.msg}</p>
}

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

function CampoSenha({ value, onInput, senhaOk, required, permitirVerSenha }) {
    const [senhaVisivel, setSenhaVisivel] = useState(false)
    const rotuloOlho = senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'

    return (
        <div class="campoInscricao">
            <label class="rotuloCampoInscricao">Senha</label>
            <div class="envoltorioSenhaInscricao">
                <input
                    class={`inputCampoInscricao ${permitirVerSenha ? 'inputSenhaComOlhoInscricao' : ''}`}
                    type={permitirVerSenha && senhaVisivel ? 'text' : 'password'}
                    value={value}
                    onInput={onInput}
                    required={required}
                />
                {permitirVerSenha && (
                    <button
                        type="button"
                        class="botaoVerSenhaInscricao"
                        tabIndex={-1}
                        title={rotuloOlho}
                        aria-label={rotuloOlho}
                        aria-pressed={senhaVisivel}
                        onClick={() => setSenhaVisivel(visivel => !visivel)}
                    >
                        <IconeOlhoSenhaInscricao aberto={senhaVisivel} />
                    </button>
                )}
            </div>
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

/* Olho do campo de senha: pálpebra aberta, ou riscada quando a senha
   está visível — o risco indica a ação de esconder. */
function IconeOlhoSenhaInscricao({ aberto }) {
    return (
        <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        >
            <path d="M2 12s3.6-6.5 10-6.5 10 6.5 10 6.5-3.6 6.5-10 6.5S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {aberto && <line x1="4" y1="20" x2="20" y2="4" />}
        </svg>
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
