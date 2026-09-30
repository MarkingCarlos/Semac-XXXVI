import { useMemo, useState } from 'preact/hooks';
import ModalTopoDashboard from './ModalTopoDashboard.jsx';

/* Ignora acento e caixa na busca: "joao" encontra "João". */
function normalizar(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* Detalhe do card de ranking: todos os participantes por pontuação, com
   busca por nome. A posição exibida é a do ranking geral, não a da lista
   filtrada — buscar alguém mostra onde ele está de verdade.

   Props:
     ranking  — resposta de GET /api/dashboard/ranking
     aoFechar — () => void */
export default function ModalRankingCompleto({ ranking, aoFechar }) {
    const [busca, setBusca] = useState('');

    const filtrados = useMemo(() => {
        const alvo = normalizar(busca.trim());
        if (!alvo) return ranking;
        return ranking.filter((participante) => normalizar(participante.nome).includes(alvo));
    }, [ranking, busca]);

    return (
        <ModalTopoDashboard
            titulo="Ranking de participantes"
            subtitulo={`${ranking.length} participantes por pontuação`}
            aoFechar={aoFechar}
        >
            <input
                type="search"
                className="campoBuscaModalDashboard"
                placeholder="Buscar participante pelo nome"
                aria-label="Buscar participante pelo nome"
                value={busca}
                onInput={(evento) => setBusca(evento.currentTarget.value)}
            />

            {filtrados.length === 0 ? (
                <p className="estadoModalDashboard">
                    {ranking.length === 0 ? 'Nenhum participante pontuou ainda.' : 'Nenhum participante encontrado.'}
                </p>
            ) : (
                <ol className="listaModalDashboard">
                    {filtrados.map((participante) => (
                        <li
                            key={participante.id}
                            className={`linhaModalDashboard ${participante.posicao <= 3 ? 'linhaDestaqueModalDashboard' : ''}`}
                        >
                            <span className="posicaoLinhaModalDashboard">{participante.posicao}º</span>
                            <span className="blocoTextoLinhaModalDashboard">
                                <span className="nomeLinhaModalDashboard">{participante.nome}</span>
                                <span className="detalheLinhaModalDashboard">
                                    {participante.nivel ? `${participante.nivel} · ` : ''}{participante.email}
                                </span>
                            </span>
                            <span className="valorLinhaModalDashboard">
                                {participante.xp}
                                <span className="rotuloValorLinhaModalDashboard">XP</span>
                            </span>
                        </li>
                    ))}
                </ol>
            )}
        </ModalTopoDashboard>
    );
}
