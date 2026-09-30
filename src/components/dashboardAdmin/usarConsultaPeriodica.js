import { useEffect, useRef, useState } from 'preact/hooks';

/* Intervalo do "tempo real" da leitura de QR. Consulta periódica em vez
   de WebSocket/SSE: o volume de um evento não pede mais do que isso. */
export const INTERVALO_ATUALIZACAO_MS = 10000;

/* Busca `consultar()` ao montar e, com `periodico`, repete a cada
   INTERVALO_ATUALIZACAO_MS enquanto a aba do navegador está visível (e
   de novo assim que ela volta a ficar visível). Uma falha numa
   atualização mantém o último dado bom na tela.

   Devolve { dados, erro, carregando }. */
export function usarConsultaPeriodica(consultar, periodico = false) {
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(true);
    const consultarRef = useRef(consultar);
    consultarRef.current = consultar;

    useEffect(() => {
        let ativo = true;
        let intervalo = null;

        function carregar() {
            consultarRef.current()
                .then((resposta) => { if (ativo) { setDados(resposta); setErro(''); } })
                .catch((e) => { if (ativo) setErro(e.message); })
                .finally(() => { if (ativo) setCarregando(false); });
        }

        function iniciarIntervalo() {
            clearInterval(intervalo);
            if (periodico && document.visibilityState === 'visible') {
                intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);
            }
        }

        function aoMudarVisibilidade() {
            if (document.visibilityState === 'visible') carregar();
            iniciarIntervalo();
        }

        carregar();
        iniciarIntervalo();
        if (periodico) document.addEventListener('visibilitychange', aoMudarVisibilidade);

        return () => {
            ativo = false;
            clearInterval(intervalo);
            document.removeEventListener('visibilitychange', aoMudarVisibilidade);
        };
    }, [periodico]);

    return { dados, erro, carregando };
}
