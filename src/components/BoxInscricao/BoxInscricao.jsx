// Box de inscrição e login — renderizado na página /inscricao.
//
// Duas abas:
//   "INSCREVER-SE" → formulário completo (nome, cpf, email, senha, camisa)
//   "ENTRAR"       → formulário simplificado (email, senha)
//
// Os dados mapeiam diretamente para os modelos Java:
//   Pessoa (nome, cpf, email, senha) + CamisaPedido (modelo, tamanho)

import { useState } from 'preact/hooks'
import './boxInscricao.css'

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

    const [form, setForm] = useState({ nome: '', cpf: '', email: '', senha: '' })
    const [modelo,  setModelo]  = useState('BABY_LOOK')
    const [tamanho, setTamanho] = useState('M')

    // Validação em tempo real dos requisitos da senha
    const senhaOk = {
        especial: /[^a-zA-Z0-9]/.test(form.senha),
        maiusculo: /[A-Z]/.test(form.senha),
        minimo8:  form.senha.length >= 8,
    }

    function setField(campo, valor) {
        setForm(prev => ({ ...prev, [campo]: valor }))
    }

    function handleSubmitInscricao(e) {
        e.preventDefault()
        // TODO: POST /api/pessoas (Pessoa) + POST /api/camisa-pedido (CamisaPedido)
        console.log({ ...form, modelo, tamanho })
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
                    />
                    <CampoTexto
                        label="CPF"
                        value={form.cpf}
                        onInput={e => setField('cpf', mascaraCPF(e.target.value))}
                        inputMode="numeric"
                    />
                    <CampoTexto
                        label="E-mail"
                        type="email"
                        value={form.email}
                        onInput={e => setField('email', e.target.value)}
                    />
                    <CampoSenha
                        value={form.senha}
                        onInput={e => setField('senha', e.target.value)}
                        senhaOk={senhaOk}
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
                            Você receberá a camisa juntamente com o kit SEMAC
                        </span>
                    </div>

                    <button type="submit" class="btn-confirmar">
                        Confirmar Inscrição
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
                    />
                    <CampoSenha
                        value={form.senha}
                        onInput={e => setField('senha', e.target.value)}
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
function CampoTexto({ label, type = 'text', value, onInput, inputMode }) {
    return (
        <div class="campo">
            <label class="campo-label">{label}</label>
            <input
                class="campo-input"
                type={type}
                value={value}
                onInput={onInput}
                inputMode={inputMode}
            />
        </div>
    )
}

// Campo de senha com indicadores de validação abaixo.
// `senhaOk` é opcional — quando ausente (aba "Entrar"), os indicadores são omitidos.
function CampoSenha({ value, onInput, senhaOk }) {
    return (
        <div class="campo">
            <label class="campo-label">Senha</label>
            <input
                class="campo-input"
                type="password"
                value={value}
                onInput={onInput}
            />
            {senhaOk && (
                <div class="senha-validacao">
                    <Indicador ok={senhaOk.especial}  texto="1 caractere especial" />
                    <Indicador ok={senhaOk.maiusculo} texto="1 caractere maiúsculo" />
                    <Indicador ok={senhaOk.minimo8}   texto="no mínimo 8 caracteres" />
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
