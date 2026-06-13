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
function LinhaParticipante({ participante }) {
    const confirmados = contarStatus(participante.eventoParticipantes, STATUS.PRESENTE)
    const aguardando  = contarStatus(participante.eventoParticipantes, STATUS.INSCRITO)
    const ausencias   = contarStatus(participante.eventoParticipantes, STATUS.AUSENTE)

    return (
        <tr>
            <td class="celulaNomeAdmin">{participante.nome}</td>
            <td class="celulaEmailAdmin">{participante.email}</td>
            <td class="celulaRaAdmin">{participante.ra ?? '—'}</td>
            <td>
                <span class={`badgeContaAdmin ${participante.ativo ? 'badgeContaAtivoAdmin' : 'badgeContaInativoAdmin'}`}>
                    {participante.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td class="celulaNumeroAdmin">{participante.eventoParticipantes.length}</td>
            <td class="celulaNumeroAdmin celulaConfirmadosAdmin">{confirmados}</td>
            <td class="celulaNumeroAdmin celulaAguardandoAdmin">{aguardando}</td>
            <td class="celulaNumeroAdmin celulaAusenciasAdmin">{ausencias}</td>
        </tr>
    )
}

export default function TabelaParticipantes({ participantes }) {
    const [busca, setBusca] = useState('')

    const filtrados = useMemo(() =>
        participantes.filter(participante =>
            participante.nome.toLowerCase().includes(busca.toLowerCase()) ||
            participante.email.toLowerCase().includes(busca.toLowerCase())
        ),
        [participantes, busca]
    )

    return (
        <div class="conteinerTabelaAdmin">
            <div class="topoTabelaAdmin">
                <h2 class="tituloTabelaAdmin">Participantes</h2>
                <input
                    class="inputBuscaAdmin"
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={busca}
                    onInput={e => setBusca(e.target.value)}
                />
            </div>

            <div class="scrollTabelaAdmin">
                <table class="tabelaAdmin">
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
                                <td colSpan={8} class="tabelaVaziaAdmin">
                                    Nenhum participante encontrado.
                                </td>
                            </tr>
                        ) : filtrados.map(participante => (
                            <LinhaParticipante key={participante.id} participante={participante} />
                        ))}
                    </tbody>
                </table>
            </div>

            <div class="rodapeTabelaAdmin">
                Exibindo {filtrados.length} de {participantes.length} participantes
            </div>
        </div>
    )
}
