// Tabela de participantes com busca em tempo real por nome ou e-mail.
//
// Cada linha exibe: nome, e-mail, RA, status da conta e contadores de presença por evento.
// A filtragem é feita no cliente — quando houver muitos participantes,
// considerar mover para query params na API (?busca=...).
//
// Props:
//   participantes — array completo de participantes vindo do Admin pai

import { useState, useMemo } from 'preact/hooks'
import { STATUS, contarStatus } from './mockParticipantes.js'

// Linha individual da tabela para um participante.
// Separada para manter o map() do tbody limpo e legível.
function LinhaParticipante({ p }) {
    const confirmados = contarStatus(p.eventoParticipantes, STATUS.PRESENTE)
    const aguardando  = contarStatus(p.eventoParticipantes, STATUS.INSCRITO)
    const ausencias   = contarStatus(p.eventoParticipantes, STATUS.AUSENTE)

    return (
        <tr>
            <td class="td-nome">{p.nome}</td>
            <td class="td-email">{p.email}</td>
            <td class="td-ra">{p.ra ?? '—'}</td>
            <td>
                <span class={`badge ${p.ativo ? 'badge-ativo' : 'badge-inativo'}`}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="td-numero">{p.eventoParticipantes.length}</td>
            <td class="td-numero td-confirmados">{confirmados}</td>
            <td class="td-numero td-aguardando">{aguardando}</td>
            <td class="td-numero td-ausencias">{ausencias}</td>
        </tr>
    )
}

export default function TabelaParticipantes({ participantes }) {
    const [busca, setBusca] = useState('')

    const filtrados = useMemo(() =>
        participantes.filter(p =>
            p.nome.toLowerCase().includes(busca.toLowerCase()) ||
            p.email.toLowerCase().includes(busca.toLowerCase())
        ),
        [participantes, busca]
    )

    return (
        <div class="tabela-container">
            <div class="tabela-topo">
                <h2 class="tabela-titulo">Participantes</h2>
                <input
                    class="busca-input"
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={busca}
                    onInput={e => setBusca(e.target.value)}
                />
            </div>

            <div class="tabela-scroll">
                <table class="tabela">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>RA</th>
                            <th>Conta</th>
                            <th>Inscrições</th>
                            <th>Confirmados</th>
                            <th>Aguardando</th>
                            <th>Ausências</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 ? (
                            <tr>
                                <td colSpan={8} class="tabela-vazia">
                                    Nenhum participante encontrado.
                                </td>
                            </tr>
                        ) : filtrados.map(p => (
                            <LinhaParticipante key={p.id} p={p} />
                        ))}
                    </tbody>
                </table>
            </div>

            <div class="tabela-rodape">
                Exibindo {filtrados.length} de {participantes.length} participantes
            </div>
        </div>
    )
}
