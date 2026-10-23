import { useState, useEffect } from 'preact/hooks';
import {
    listarDiasTermoAdmin,
    salvarDataDiaTermo,
    adicionarPalavrasTermo,
    removerPalavraTermo,
} from '../data/apiTermo.js';
import ModalPalavrasDiaTermo from './ModalPalavrasDiaTermo.jsx';
import './termoAdmin.css';

/* Termo — os quatro dias do jogo em /termo (tabelas `termo_dia` e
   `termo_palavra`). Bloco da sub-aba Gamificação de Informações SEMAC,
   restrito a DIRETOR_SITE/PRESIDENTE (quem monta ou não este componente é
   o InformacoesSemac.jsx).

   Cada dia tem uma data e quantas palavras a diretoria quiser, de 5 a 10
   letras. Quando o participante abre o jogo no dia, o servidor sorteia
   uma delas para ele, sempre entre as que menos gente recebeu: ninguém
   repete a palavra de outro enquanto houver palavra livre.

   A data de cada dia é o que decide qual está valendo: o servidor compara
   com a data de hoje e não precisa de ninguém virando chave durante a
   semana.

   As palavras cadastradas voltam na leitura, mas ficam recolhidas: o
   cartão só mostra quantas são e a lista abre num modal, ainda mascarada
   até alguém clicar em "Mostrar" — assim não vazam num compartilhamento
   de tela durante reunião. */

const ANO_ATUAL = new Date().getFullYear();
const TOTAL_DIAS = 4;
const TAMANHO_MINIMO_PALAVRA = 5;
const TAMANHO_MAXIMO_PALAVRA = 10;

/* Sem acento e em maiúsculas — é assim que o servidor grava e compara.
   Evita cadastrar "CAFÉS" e o jogador nunca conseguir digitar. */
const normalizarPalavra = (texto) =>
    texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase();

/* O campo aceita uma lista colada: uma por linha, ou separadas por
   vírgula, ponto e vírgula ou espaço. Palavra com hífen, número ou fora do
   tamanho volta em `invalidas` — melhor recusar do que cadastrar
   "GUARDACHUVA" sem a pessoa perceber. */
const separarPalavras = (texto) => {
    const palavras = [];
    const invalidas = [];
    texto.split(/[\s,;]+/).filter(Boolean).forEach((bruta) => {
        const palavra = normalizarPalavra(bruta);
        const tamanhoValido = palavra.length >= TAMANHO_MINIMO_PALAVRA
            && palavra.length <= TAMANHO_MAXIMO_PALAVRA;
        if (/^[A-Z]+$/.test(palavra) && tamanhoValido) palavras.push(palavra);
        else invalidas.push(bruta);
    });
    return { palavras, invalidas };
};

const formatarData = (data) => {
    if (!data) return '—';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
};

export default function TermoAdmin() {
    const [dias, setDias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    /* Rascunho por dia: { data, palavras }. `palavras` é o texto do campo
       de novas palavras — nasce sempre vazio; as já cadastradas ficam na
       lista acima dele. */
    const [rascunhos, setRascunhos] = useState({});
    const [diaSalvando, setDiaSalvando] = useState(null);
    const [palavraRemovendo, setPalavraRemovendo] = useState(null);
    const [avisoSalvo, setAvisoSalvo] = useState(null);
    /* Guarda só o número do dia aberto no modal, não uma cópia: assim a
       lista do modal acompanha `dias` quando uma palavra é removida. */
    const [diaModalPalavrasTermoAdmin, setDiaModalPalavrasTermoAdmin] = useState(null);
    const diaAbertoModalTermo = dias.find((d) => d.dia === diaModalPalavrasTermoAdmin);

    useEffect(() => {
        let ativo = true;
        listarDiasTermoAdmin(ANO_ATUAL)
            .then((lista) => {
                if (!ativo) return;
                setDias(lista);
                setRascunhos(Object.fromEntries(
                    lista.map((d) => [d.dia, { data: d.data ?? '', palavras: '' }]),
                ));
            })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    const alterarRascunho = (dia, campo, valor) => {
        setRascunhos((prev) => ({ ...prev, [dia]: { ...prev[dia], [campo]: valor } }));
        setAvisoSalvo(null);
    };

    const substituirDia = (salvo) => {
        setDias((prev) => prev.map((d) => (d.dia === salvo.dia ? salvo : d)));
    };

    const salvarData = async (dia) => {
        const rascunho = rascunhos[dia] ?? { data: '', palavras: '' };
        if (!rascunho.data) {
            setErro(`Informe a data do dia ${dia}.`);
            return;
        }

        setErro('');
        setDiaSalvando(dia);
        try {
            const salvo = await salvarDataDiaTermo(dia, { ano: ANO_ATUAL, data: rascunho.data });
            substituirDia(salvo);
            setAvisoSalvo({ dia, texto: `Data do dia ${dia} salva.` });
        } catch (e) {
            setErro(e.message);
        } finally {
            setDiaSalvando(null);
        }
    };

    const adicionarPalavras = async (dia) => {
        const rascunho = rascunhos[dia] ?? { data: '', palavras: '' };
        const { palavras, invalidas } = separarPalavras(rascunho.palavras);

        if (invalidas.length > 0) {
            setErro(`Cada palavra precisa ter de ${TAMANHO_MINIMO_PALAVRA} a ${TAMANHO_MAXIMO_PALAVRA} letras, `
                + `sem hífen nem número: ${invalidas.join(', ')}.`);
            return;
        }
        if (palavras.length === 0) {
            setErro(`Digite ao menos uma palavra para o dia ${dia}.`);
            return;
        }

        setErro('');
        setDiaSalvando(dia);
        try {
            const salvo = await adicionarPalavrasTermo(dia, { ano: ANO_ATUAL, palavras });
            substituirDia(salvo);
            /* Limpa o campo depois de salvar: as palavras não ficam na tela
               nem na memória do navegador mais do que o necessário. */
            setRascunhos((prev) => ({ ...prev, [dia]: { ...prev[dia], palavras: '' } }));
            setAvisoSalvo({
                dia,
                texto: palavras.length === 1 ? '1 palavra adicionada.' : `${palavras.length} palavras adicionadas.`,
            });
        } catch (e) {
            setErro(e.message);
        } finally {
            setDiaSalvando(null);
        }
    };

    const removerPalavra = async (id) => {
        setErro('');
        setAvisoSalvo(null);
        setPalavraRemovendo(id);
        try {
            substituirDia(await removerPalavraTermo(id));
        } catch (e) {
            setErro(e.message);
        } finally {
            setPalavraRemovendo(null);
        }
    };

    const diasComPalavras = dias.filter((d) => d.data && d.palavras.length > 0).length;
    const totalPalavras = dias.reduce((soma, d) => soma + d.palavras.length, 0);

    return (
        <section className="blocoInfoSemac" aria-label="Termo">
            <div className="cabecalhoBlocoInfoSemac cabecalhoBlocoTimesTermoInfoSemac">
                <div>
                    <h2 className="tituloBlocoInfoSemac">Termo</h2>
                </div>
            </div>

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

            <p className="avisoSigiloTermoAdmin">
                Cada participante recebe uma palavra diferente.
            </p>

            <div className="faixaResumoAdmin">
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Dias com palavras</span>
                    <strong className="valorItemResumoAdmin valorDestaqueAdmin">
                        {diasComPalavras} de {TOTAL_DIAS}
                    </strong>
                </div>
                <div className="itemResumoAdmin">
                    <span className="rotuloItemResumoAdmin">Palavras cadastradas</span>
                    <strong className="valorItemResumoAdmin">{totalPalavras}</strong>
                </div>
            </div>

            {carregando && <p className="estadoCarregandoParticipantesAdmin">Carregando dias…</p>}

            {!carregando && (
                <div className="listaDiasTermoAdmin">
                    {dias.map((d) => {
                        const rascunho = rascunhos[d.dia] ?? { data: '', palavras: '' };
                        const salvandoEste = diaSalvando === d.dia;
                        const temData = Boolean(d.data);
                        return (
                            <div key={d.dia} className="cartaoDiaTermoAdmin">
                                <div className="cabecalhoDiaTermoAdmin">
                                    <span className="rotuloDiaTermoAdmin">Dia {d.dia}</span>
                                    <span
                                        className={temData && d.palavras.length > 0
                                            ? 'etiquetaStatusTermoAdmin etiquetaDefinidaTermoAdmin'
                                            : 'etiquetaStatusTermoAdmin'}
                                    >
                                        {temData
                                            ? `${d.palavras.length} ${d.palavras.length === 1 ? 'palavra' : 'palavras'} · ${formatarData(d.data)}`
                                            : 'Sem data'}
                                    </span>
                                </div>
                                <form
                                    className="formularioDataDiaTermoAdmin"
                                    onSubmit={(evento) => { evento.preventDefault(); salvarData(d.dia); }}
                                >
                                    <label className="campoFormularioFinancas">

                                        <input
                                            className="entradaFormularioFinancas"
                                            type="date"
                                            value={rascunho.data}
                                            onInput={(e) => alterarRascunho(d.dia, 'data', e.currentTarget.value)}
                                            required
                                        />
                                    </label>
                                    <button
                                        type="submit"
                                        className="botaoFantasmaFinancas"
                                        disabled={salvandoEste || rascunho.data === (d.data ?? '')}
                                    >
                                        Salvar data
                                    </button>
                                </form>

                                {d.palavras.length > 0 && (
                                    <button
                                        type="button"
                                        className="botaoVerPalavrasDiaTermoAdmin"
                                        onClick={() => setDiaModalPalavrasTermoAdmin(d.dia)}
                                    >
                                        Ver palavras ({d.palavras.length})
                                    </button>
                                )}

                                <form
                                    className="camposDiaTermoAdmin"
                                    onSubmit={(evento) => { evento.preventDefault(); adicionarPalavras(d.dia); }}
                                >
                                    <label className="campoFormularioFinancas">
                                        <span className="rotuloCampoFinancas">Novas palavras</span>
                                        <textarea
                                            className="entradaFormularioFinancas entradaPalavrasTermoAdmin"
                                            rows={3}
                                            autoComplete="off"
                                            spellcheck={false}
                                            disabled={!temData}
                                            placeholder={temData
                                                ? 'Uma por linha, ou separadas por vírgula'
                                                : 'Salve a data do dia antes'}
                                            value={rascunho.palavras}
                                            onInput={(e) => alterarRascunho(d.dia, 'palavras', e.currentTarget.value)}
                                        />
                                    </label>

                                    <div className="acoesDiaTermoAdmin">
                                        {avisoSalvo?.dia === d.dia && (
                                            <span className="avisoSalvoTermoAdmin">{avisoSalvo.texto}</span>
                                        )}
                                        <button
                                            type="submit"
                                            className="botaoPrimarioFinancas"
                                            disabled={!temData || salvandoEste || !rascunho.palavras.trim()}
                                        >
                                            {salvandoEste ? 'Salvando…' : 'Adicionar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        );
                    })}
                </div>
            )}

            {diaAbertoModalTermo && (
                <ModalPalavrasDiaTermo
                    dia={diaAbertoModalTermo}
                    rotuloData={formatarData(diaAbertoModalTermo.data)}
                    palavraRemovendo={palavraRemovendo}
                    aoRemover={removerPalavra}
                    aoFechar={() => setDiaModalPalavrasTermoAdmin(null)}
                />
            )}
        </section>
    );
}
