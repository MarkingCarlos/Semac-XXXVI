import { useState, useEffect } from 'preact/hooks';
import { listarPalavrasTermo, salvarPalavraTermo } from '../data/apiTermo.js';
import './termoAdmin.css';

/* Termo — as quatro palavras do jogo em /termo, uma por dia do evento
   (tabela `termo_palavra`). Restrito a DIRETOR_SITE/PRESIDENTE.

   A data de cada dia é o que decide qual palavra está valendo: o servidor
   compara com a data de hoje e não precisa de ninguém virando chave
   durante a semana.

   A palavra cadastrada NÃO volta na leitura — a API só informa se aquele
   dia já tem uma definida. É de propósito: a palavra não sai do servidor
   nem para quem a cadastrou, senão bastaria uma conta de diretoria para
   descobri-la. Quem esquecer qual era cadastra outra. */

const ANO_ATUAL = new Date().getFullYear();
const TOTAL_DIAS = 4;
const TAMANHO_PALAVRA = 5;

/* Só letras, sem acento e em maiúsculas — é assim que o servidor grava e
   compara. Evita cadastrar "CAFÉS" e o jogador nunca conseguir digitar. */
const normalizarPalavra = (texto) =>
    texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase()
        .slice(0, TAMANHO_PALAVRA);

const formatarData = (data) => {
    if (!data) return '—';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
};

export default function TermoAdmin() {
    const [dias, setDias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    /* Rascunho por dia: { data, palavra }. Separado de `dias` porque a
       palavra nunca vem da API — o campo nasce sempre vazio. */
    const [rascunhos, setRascunhos] = useState({});
    const [diaSalvando, setDiaSalvando] = useState(null);
    const [diaSalvo, setDiaSalvo] = useState(null);

    useEffect(() => {
        let ativo = true;
        listarPalavrasTermo(ANO_ATUAL)
            .then((lista) => {
                if (!ativo) return;
                setDias(lista);
                setRascunhos(Object.fromEntries(
                    lista.map((d) => [d.dia, { data: d.data ?? '', palavra: '' }]),
                ));
            })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    const alterarRascunho = (dia, campo, valor) => {
        setRascunhos((prev) => ({ ...prev, [dia]: { ...prev[dia], [campo]: valor } }));
        setDiaSalvo(null);
    };

    const salvarDia = async (dia) => {
        const rascunho = rascunhos[dia] ?? { data: '', palavra: '' };
        const palavra = normalizarPalavra(rascunho.palavra);

        if (!rascunho.data) {
            setErro(`Informe a data do dia ${dia}.`);
            return;
        }
        if (palavra.length !== TAMANHO_PALAVRA) {
            setErro(`A palavra do dia ${dia} precisa ter ${TAMANHO_PALAVRA} letras.`);
            return;
        }

        setErro('');
        setDiaSalvando(dia);
        try {
            const salvo = await salvarPalavraTermo(dia, {
                ano: ANO_ATUAL,
                data: rascunho.data,
                palavra,
            });
            setDias((prev) => prev.map((d) => (d.dia === dia ? salvo : d)));
            /* Limpa o campo depois de salvar: a palavra não fica na tela
               nem na memória do navegador mais do que o necessário. */
            setRascunhos((prev) => ({ ...prev, [dia]: { data: salvo.data, palavra: '' } }));
            setDiaSalvo(dia);
        } catch (e) {
            setErro(e.message);
        } finally {
            setDiaSalvando(null);
        }
    };

    const diasDefinidos = dias.filter((d) => d.definida).length;

    return (
        <div className="conteudoTermoAdmin">
            <header className="cabecalhoSecaoFinancas">
                <div>
                    <h1 className="tituloSecaoFinancas">Termo</h1>
                    <p className="subtituloSecaoFinancas">
                        A palavra de cada dia do jogo em /termo — 5 letras, acertar vale 5 XP
                    </p>
                </div>
            </header>

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

            <p className="avisoSigiloTermoAdmin">
                A palavra não volta na leitura, nem aqui: depois de salva, só o servidor a conhece.
                Se esquecer qual era, cadastre outra.
            </p>

            <div className="faixaResumoAdmin">
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Dias definidos</span>
                    <strong className="valorItemResumoAdmin valorDestaqueAdmin">
                        {diasDefinidos} de {TOTAL_DIAS}
                    </strong>
                </div>
            </div>

            {carregando && <p className="estadoCarregandoParticipantesAdmin">Carregando palavras…</p>}

            {!carregando && (
                <div className="listaDiasTermoAdmin">
                    {dias.map((d) => {
                        const rascunho = rascunhos[d.dia] ?? { data: '', palavra: '' };
                        const salvandoEste = diaSalvando === d.dia;
                        return (
                            <form
                                key={d.dia}
                                className="cartaoDiaTermoAdmin"
                                onSubmit={(evento) => { evento.preventDefault(); salvarDia(d.dia); }}
                            >
                                <div className="cabecalhoDiaTermoAdmin">
                                    <span className="rotuloDiaTermoAdmin">Dia {d.dia}</span>
                                    <span
                                        className={d.definida
                                            ? 'etiquetaStatusTermoAdmin etiquetaDefinidaTermoAdmin'
                                            : 'etiquetaStatusTermoAdmin'}
                                    >
                                        {d.definida ? `Definida · ${formatarData(d.data)}` : 'Não definida'}
                                    </span>
                                </div>

                                <div className="camposDiaTermoAdmin">
                                    <label className="campoFormularioFinancas">
                                        <span className="rotuloCampoFinancas">Data</span>
                                        <input
                                            className="entradaFormularioFinancas"
                                            type="date"
                                            value={rascunho.data}
                                            onInput={(e) => alterarRascunho(d.dia, 'data', e.currentTarget.value)}
                                            required
                                        />
                                    </label>

                                    <label className="campoFormularioFinancas">
                                        <span className="rotuloCampoFinancas">
                                            {d.definida ? 'Nova palavra' : 'Palavra'}
                                        </span>
                                        {/* Sempre obrigatória, mesmo para só trocar a data:
                                            como a palavra não pode ser lida de volta, não há
                                            como o servidor "manter a atual" sem que alguém a
                                            digite de novo. */}
                                        <input
                                            className="entradaFormularioFinancas entradaPalavraTermoAdmin"
                                            type="text"
                                            inputMode="text"
                                            autoComplete="off"
                                            spellcheck={false}
                                            maxLength={TAMANHO_PALAVRA}
                                            placeholder="5 letras"
                                            value={rascunho.palavra}
                                            onInput={(e) => alterarRascunho(
                                                d.dia, 'palavra', normalizarPalavra(e.currentTarget.value),
                                            )}
                                        />
                                    </label>
                                </div>

                                <div className="acoesDiaTermoAdmin">
                                    {diaSalvo === d.dia && (
                                        <span className="avisoSalvoTermoAdmin">Palavra do dia {d.dia} salva.</span>
                                    )}
                                    <button
                                        type="submit"
                                        className="botaoPrimarioFinancas"
                                        disabled={salvandoEste}
                                    >
                                        {salvandoEste ? 'Salvando…' : 'Salvar dia'}
                                    </button>
                                </div>
                            </form>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
