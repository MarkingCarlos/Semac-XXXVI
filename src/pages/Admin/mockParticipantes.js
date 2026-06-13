// Espelho do enum Java StatusPresenca (java_api/model/enums/StatusPresenca.java)
export const STATUS = {
    AUSENTE:  'AUSENTE',
    PRESENTE: 'PRESENTE',
    INSCRITO: 'INSCRITO',
}

// Conta quantos registros de eventoParticipantes têm o status informado.
// Usada em StatsGrid (totais globais) e TabelaParticipantes (totais por linha).
export function contarStatus(eventoParticipantes, status) {
    return eventoParticipantes.filter(eventoParticipante => eventoParticipante.status === status).length
}

// Dados de exemplo para desenvolvimento do painel admin.
// Substituir por: GET /api/pessoas?role=PARTICIPANTE quando a API estiver pronta.
// Estrutura espelha o modelo Java: Pessoa + List<EventoParticipante>.
export const MOCK_PARTICIPANTES = [
    {
        id: 1, nome: 'Ana Carolina Lima', email: 'ana.lima@aluno.ufscar.br',
        ra: '20221001', ativo: true,
        eventoParticipantes: [{ status: STATUS.PRESENTE }, { status: STATUS.PRESENTE }, { status: STATUS.INSCRITO }],
    },
    {
        id: 2, nome: 'Bruno Santos Oliveira', email: 'bruno.oliveira@aluno.ufscar.br',
        ra: '20221045', ativo: true,
        eventoParticipantes: [{ status: STATUS.INSCRITO }, { status: STATUS.INSCRITO }],
    },
    {
        id: 3, nome: 'Camila Ferreira', email: 'camila.ferreira@aluno.ufscar.br',
        ra: '20211022', ativo: true,
        eventoParticipantes: [{ status: STATUS.PRESENTE }, { status: STATUS.AUSENTE }, { status: STATUS.PRESENTE }],
    },
    {
        id: 4, nome: 'Diego Alves Moreira', email: 'diego.moreira@aluno.ufscar.br',
        ra: '20231015', ativo: true,
        eventoParticipantes: [],
    },
    {
        id: 5, nome: 'Elena Costa', email: 'elena.costa@aluno.ufscar.br',
        ra: '20221078', ativo: false,
        eventoParticipantes: [{ status: STATUS.INSCRITO }],
    },
    {
        id: 6, nome: 'Felipe Rodrigues', email: 'felipe.rodrigues@aluno.ufscar.br',
        ra: '20201099', ativo: true,
        eventoParticipantes: [{ status: STATUS.PRESENTE }, { status: STATUS.PRESENTE }, { status: STATUS.PRESENTE }, { status: STATUS.AUSENTE }],
    },
    {
        id: 7, nome: 'Gabriela Mendes', email: 'gabriela.mendes@aluno.ufscar.br',
        ra: '20231056', ativo: true,
        eventoParticipantes: [{ status: STATUS.INSCRITO }, { status: STATUS.INSCRITO }, { status: STATUS.INSCRITO }],
    },
    {
        id: 8, nome: 'Henrique Souza Lima', email: 'henrique.lima@aluno.ufscar.br',
        ra: null, ativo: true,
        eventoParticipantes: [{ status: STATUS.PRESENTE }],
    },
    {
        id: 9, nome: 'Isabela Nogueira', email: 'isabela.nogueira@aluno.ufscar.br',
        ra: '20221033', ativo: true,
        eventoParticipantes: [{ status: STATUS.AUSENTE }, { status: STATUS.AUSENTE }],
    },
    {
        id: 10, nome: 'João Pedro Martins', email: 'joao.martins@aluno.ufscar.br',
        ra: '20191088', ativo: false,
        eventoParticipantes: [],
    },
]
