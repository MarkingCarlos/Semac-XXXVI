// Box de inscrição e login — renderizado na página /inscricao.
//
// Duas abas:
//   "INSCREVER-SE" → formulário completo (nome, cpf, ra, email, senha, camisa)
//   "ENTRAR"       → formulário simplificado (email, senha)
//
// Os dados mapeiam diretamente para os modelos Java:
//   Pessoa (nome, cpf, ra, email, senha) + CamisaPedido (modelo, tamanho)

import { useState } from 'preact/hooks'
import './boxInscricao.css'

const API_URL = 'http://localhost:8080'

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
    const [aba, setAba] = useState('inscricao')

    const [form, setForm] = useState({ nome: '', cpf: '', ra: '', email: '', senha: '' })
    const [modelo,  setModelo]  = useState('BABY_LOOK')
    const [tamanho, setTamanho] = useState('M')

    const [enviando, setEnviando] = useState(false)
    const [feedback, setFeedback] = useState(null) // { tipo: 'sucesso'|'erro', msg: string }

    // Validação em tempo real dos requisitos da senha
    const senhaOk = {
        especial: /[^a-zA-Z0-9]/.test(form.senha),
        maiusculo: /[A-Z]/.test(form.senha),
        minimo8:  form.senha.length >= 8,
    }
    const senhaValida = senhaOk.especial && senhaOk.maiusculo && senhaOk.minimo8

    function setField(campo, valor) {
        setForm(prev => ({ ...prev, [campo]: valor }))
    }

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
                    onClick={() => setAba('inscricao')}
                >
                    Inscrever-se
                </button>
                <button
                    class={`aba ${aba === 'entrar' ? 'aba-ativa' : ''}`}
                    onClick={() => setAba('entrar')}
                >
                    Entrar
                </button>
            </div>

            {/* ── Formulário: Inscrever-se ────────────────────────── */}
            {aba === 'inscricao' && (
                <form class="box-form" onSubmit={handleSubmitInscricao}>
                    <CampoTexto
                        label="Nome Completo"
                        value={form.nome}
                        onInput={e => setField('nome', e.target.value)}
                        required
                    />
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }} >
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
                            Você receberá a camisa juntamente com o kit SEMAC no dia do evento.
                        </span>
                    </div>

                    {feedback && (
                        <p class={`feedback feedback-${feedback.tipo}`}>{feedback.msg}</p>
                    )}

                    <button type="submit" class="btn-confirmar" disabled={!senhaValida || enviando}>
                        {enviando ? 'Enviando...' : 'Confirmar Inscrição'}
                    </button>
                </form>
            )}

            {/* ── Formulário: Entrar ──────────────────────────────── */}
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
        <span class={`indicador ${ok ? 'indicador-ok' : ''}`}>
            <span class="indicador-box" />
            {texto}
        </span>
    )
}
