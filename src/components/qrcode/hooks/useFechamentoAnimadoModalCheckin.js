import { useEffect, useRef, useState } from 'preact/hooks';

/* Folga além da animação de saída, caso o animationend não chegue
   (aba em segundo plano, animação cortada pelo navegador). */
const MARGEM_SEGURANCA_SAIDA_MS = 600;

/* Fechamento com animação dos modais do /checkin (sucesso e erro).

   O modal não some na hora: `fechar()` liga `saindo`, o CSS roda a
   descida do painel e, no fim dela (`aoTerminarAnimacao`), aí sim chama
   `onFechar` — que é quando a câmera volta a ler. `fecharEmMs` agenda
   esse mesmo fechamento sozinho (o sucesso se fecha após alguns
   segundos). */
export function useFechamentoAnimadoModalCheckin(onFechar, fecharEmMs = null) {
    const [saindo, setSaindo] = useState(false);
    const fechadoRef = useRef(false);

    function concluir() {
        if (fechadoRef.current) return;
        fechadoRef.current = true;
        onFechar();
    }

    function fechar() {
        setSaindo(true);
    }

    useEffect(() => {
        if (fecharEmMs == null) return undefined;
        const temporizador = setTimeout(fechar, fecharEmMs);
        return () => clearTimeout(temporizador);
    }, [fecharEmMs]);

    useEffect(() => {
        if (!saindo) return undefined;
        const temporizador = setTimeout(concluir, MARGEM_SEGURANCA_SAIDA_MS);
        return () => clearTimeout(temporizador);
    }, [saindo]);

    // Só a animação do próprio painel encerra — as dos filhos (selo)
    // também disparam animationend e sobem até aqui.
    function aoTerminarAnimacao(evento) {
        if (saindo && evento.target === evento.currentTarget) concluir();
    }

    return { saindo, fechar, aoTerminarAnimacao };
}
