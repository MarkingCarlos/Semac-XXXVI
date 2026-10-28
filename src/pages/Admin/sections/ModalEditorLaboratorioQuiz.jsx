import { useState } from 'preact/hooks';
import ModalInferiorAdmin from '../../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx';

/* Cadastro e edição de um laboratório do Quiz dos Laboratórios, já com as
   perguntas: nome, responsáveis e a lista de perguntas de múltipla
   escolha (2 a 5 alternativas, uma correta). Salvar troca a lista
   inteira no backend.

   `laboratorio` null = novo. Quem fala com a API é o
   LaboratoriosQuizAdmin (`aoSalvar`); o erro fica aqui, porque o do bloco
   estaria atrás do fundo escuro. */

const MINIMO_ALTERNATIVAS_LABORATORIO = 2;
const MAXIMO_ALTERNATIVAS_LABORATORIO = 5;
const MAXIMO_PERGUNTAS_LABORATORIO = 30;

/* Chave local estável para o Preact (as perguntas novas não têm id). */
let contadorChaveEditorLaboratorio = 0;
const novaChaveEditorLaboratorio = () => `chaveEditorLaboratorio${++contadorChaveEditorLaboratorio}`;

const novaAlternativaEditor = (texto = '', correta = false) => ({ chave: novaChaveEditorLaboratorio(), texto, correta });

const novaPerguntaEditor = () => ({
    chave: novaChaveEditorLaboratorio(),
    enunciado: '',
    alternativas: [novaAlternativaEditor('', true), novaAlternativaEditor(), novaAlternativaEditor()],
});

function perguntasParaEditor(laboratorio) {
    if (!laboratorio) return [novaPerguntaEditor()];
    return laboratorio.perguntas.map((pergunta) => ({
        chave: novaChaveEditorLaboratorio(),
        enunciado: pergunta.enunciado,
        alternativas: pergunta.alternativas.map((a) => novaAlternativaEditor(a.texto, a.correta)),
    }));
}

/* O motivo de não dar para salvar, ou null. Mesmas regras do backend. */
function problemaFormularioLaboratorio(nome, perguntas) {
    if (!nome.trim()) return 'Dê um nome ao laboratório.';
    for (let i = 0; i < perguntas.length; i++) {
        const pergunta = perguntas[i];
        if (!pergunta.enunciado.trim()) return `Escreva o enunciado da pergunta ${i + 1}.`;
        if (pergunta.alternativas.some((a) => !a.texto.trim())) return `Preencha todas as alternativas da pergunta ${i + 1}.`;
        if (pergunta.alternativas.filter((a) => a.correta).length !== 1) return `Marque a alternativa correta da pergunta ${i + 1}.`;
    }
    return null;
}

export default function ModalEditorLaboratorioQuiz({ laboratorio, aoSalvar, aoFechar }) {
    const [nomeLaboratorio, setNomeLaboratorio] = useState(laboratorio?.nome ?? '');
    const [responsaveisLaboratorio, setResponsaveisLaboratorio] = useState(laboratorio?.responsaveis ?? '');
    const [perguntasLaboratorio, setPerguntasLaboratorio] = useState(() => perguntasParaEditor(laboratorio));
    const [salvandoLaboratorio, setSalvandoLaboratorio] = useState(false);
    const [erroEditorLaboratorio, setErroEditorLaboratorio] = useState('');

    const alterarPergunta = (chavePergunta, alterar) =>
        setPerguntasLaboratorio((lista) => lista.map((p) => (p.chave === chavePergunta ? alterar(p) : p)));

    const alterarAlternativa = (chavePergunta, chaveAlternativa, alterar) =>
        alterarPergunta(chavePergunta, (p) => ({
            ...p,
            alternativas: p.alternativas.map((a) => (a.chave === chaveAlternativa ? alterar(a) : a)),
        }));

    const marcarCorreta = (chavePergunta, chaveAlternativa) =>
        alterarPergunta(chavePergunta, (p) => ({
            ...p,
            alternativas: p.alternativas.map((a) => ({ ...a, correta: a.chave === chaveAlternativa })),
        }));

    /* Remover a correta passa a marca para a primeira que sobrou. */
    const removerAlternativa = (chavePergunta, chaveAlternativa) =>
        alterarPergunta(chavePergunta, (p) => {
            const restantes = p.alternativas.filter((a) => a.chave !== chaveAlternativa);
            if (!restantes.some((a) => a.correta)) restantes[0] = { ...restantes[0], correta: true };
            return { ...p, alternativas: restantes };
        });

    const moverPergunta = (indice, direcao) =>
        setPerguntasLaboratorio((lista) => {
            const destino = indice + direcao;
            if (destino < 0 || destino >= lista.length) return lista;
            const nova = [...lista];
            [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
            return nova;
        });

    const problema = problemaFormularioLaboratorio(nomeLaboratorio, perguntasLaboratorio);

    const salvar = async (fechar) => {
        if (problema) {
            setErroEditorLaboratorio(problema);
            return;
        }
        setErroEditorLaboratorio('');
        setSalvandoLaboratorio(true);
        try {
            await aoSalvar({
                nome: nomeLaboratorio.trim(),
                responsaveis: responsaveisLaboratorio.trim(),
                perguntas: perguntasLaboratorio.map((p) => ({
                    enunciado: p.enunciado.trim(),
                    alternativas: p.alternativas.map((a) => ({ texto: a.texto.trim(), correta: a.correta })),
                })),
            });
            fechar();
        } catch (e) {
            setErroEditorLaboratorio(e.message);
            setSalvandoLaboratorio(false);
        }
    };

    return (
        <ModalInferiorAdmin
            titulo={laboratorio ? 'Editar laboratório' : 'Novo laboratório'}
            subtitulo={laboratorio && laboratorio.respostas > 0
                ? 'Quem já respondeu mantém o placar e o XP.'
                : undefined}
            aoFechar={aoFechar}
            centralizadoNoDesktop
        >
            {(fechar) => (
                <form
                    className="formularioEditorLaboratorioAdmin"
                    onSubmit={(evento) => { evento.preventDefault(); salvar(fechar); }}
                >
                    <div className="divCamposEditorLaboratorioAdmin">
                        <label className="campoFormularioFinancas">
                            <span className="rotuloCampoFinancas">Nome do laboratório</span>
                            <input
                                className="entradaFormularioFinancas"
                                maxLength={200}
                                value={nomeLaboratorio}
                                onInput={(e) => setNomeLaboratorio(e.currentTarget.value)}
                                data-foco-inicial
                                required
                            />
                        </label>
                        <label className="campoFormularioFinancas">
                            <span className="rotuloCampoFinancas">Responsáveis (opcional)</span>
                            <input
                                className="entradaFormularioFinancas"
                                maxLength={300}
                                placeholder="Prof. Ana Silva"
                                value={responsaveisLaboratorio}
                                onInput={(e) => setResponsaveisLaboratorio(e.currentTarget.value)}
                            />
                        </label>
                    </div>

                    <ol className="listaPerguntasEditorLaboratorioAdmin">
                        {perguntasLaboratorio.map((pergunta, indicePergunta) => (
                            <li key={pergunta.chave} className="itemPerguntaEditorLaboratorioAdmin">
                                <div className="cabecalhoPerguntaEditorLaboratorioAdmin">
                                    <span className="rotuloPerguntaEditorLaboratorioAdmin">Pergunta {indicePergunta + 1}</span>
                                    <div className="divAcoesTrabalhoMostraAdmin">
                                        <button
                                            type="button"
                                            className="botaoAcaoTrabalhoMostraAdmin"
                                            disabled={indicePergunta === 0}
                                            aria-label={`Subir a pergunta ${indicePergunta + 1}`}
                                            onClick={() => moverPergunta(indicePergunta, -1)}
                                        >
                                            ↑
                                        </button>
                                        <button
                                            type="button"
                                            className="botaoAcaoTrabalhoMostraAdmin"
                                            disabled={indicePergunta === perguntasLaboratorio.length - 1}
                                            aria-label={`Descer a pergunta ${indicePergunta + 1}`}
                                            onClick={() => moverPergunta(indicePergunta, 1)}
                                        >
                                            ↓
                                        </button>
                                        <button
                                            type="button"
                                            className="botaoAcaoTrabalhoMostraAdmin"
                                            onClick={() => setPerguntasLaboratorio((lista) => lista.filter((p) => p.chave !== pergunta.chave))}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </div>

                                <textarea
                                    className="entradaFormularioFinancas textareaEnunciadoEditorLaboratorioAdmin"
                                    maxLength={500}
                                    rows={2}
                                    placeholder="Enunciado da pergunta"
                                    aria-label={`Enunciado da pergunta ${indicePergunta + 1}`}
                                    value={pergunta.enunciado}
                                    onInput={(e) => {
                                        const valor = e.currentTarget.value;
                                        alterarPergunta(pergunta.chave, (p) => ({ ...p, enunciado: valor }));
                                    }}
                                />

                                <ul className="listaAlternativasEditorLaboratorioAdmin">
                                    {pergunta.alternativas.map((alternativa, indiceAlternativa) => (
                                        <li key={alternativa.chave} className="itemAlternativaEditorLaboratorioAdmin">
                                            <label
                                                className={alternativa.correta
                                                    ? 'labelCorretaEditorLaboratorioAdmin labelCorretaMarcadaEditorLaboratorioAdmin'
                                                    : 'labelCorretaEditorLaboratorioAdmin'}
                                                title="Marcar como a correta"
                                            >
                                                <input
                                                    type="radio"
                                                    className="radioCorretaEditorLaboratorioAdmin"
                                                    name={`correta${pergunta.chave}`}
                                                    checked={alternativa.correta}
                                                    onChange={() => marcarCorreta(pergunta.chave, alternativa.chave)}
                                                />
                                                {String.fromCharCode(65 + indiceAlternativa)}
                                            </label>
                                            <input
                                                className="entradaFormularioFinancas entradaAlternativaEditorLaboratorioAdmin"
                                                maxLength={300}
                                                placeholder={`Alternativa ${String.fromCharCode(65 + indiceAlternativa)}`}
                                                aria-label={`Alternativa ${String.fromCharCode(65 + indiceAlternativa)} da pergunta ${indicePergunta + 1}`}
                                                value={alternativa.texto}
                                                onInput={(e) => {
                                                    const valor = e.currentTarget.value;
                                                    alterarAlternativa(pergunta.chave, alternativa.chave, (a) => ({ ...a, texto: valor }));
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="botaoAcaoTrabalhoMostraAdmin"
                                                disabled={pergunta.alternativas.length <= MINIMO_ALTERNATIVAS_LABORATORIO}
                                                aria-label={`Remover a alternativa ${String.fromCharCode(65 + indiceAlternativa)}`}
                                                onClick={() => removerAlternativa(pergunta.chave, alternativa.chave)}
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {pergunta.alternativas.length < MAXIMO_ALTERNATIVAS_LABORATORIO && (
                                    <button
                                        type="button"
                                        className="botaoAdicionarEditorLaboratorioAdmin"
                                        onClick={() => alterarPergunta(pergunta.chave, (p) => ({
                                            ...p,
                                            alternativas: [...p.alternativas, novaAlternativaEditor()],
                                        }))}
                                    >
                                        + Alternativa
                                    </button>
                                )}
                            </li>
                        ))}
                    </ol>

                    {perguntasLaboratorio.length < MAXIMO_PERGUNTAS_LABORATORIO && (
                        <button
                            type="button"
                            className="botaoVerTrabalhosMostraAdmin"
                            onClick={() => setPerguntasLaboratorio((lista) => [...lista, novaPerguntaEditor()])}
                        >
                            + Adicionar pergunta
                        </button>
                    )}

                    {erroEditorLaboratorio && <p className="avisoErroAdmin" role="alert">{erroEditorLaboratorio}</p>}

                    <div className="divRodapeEditorLaboratorioAdmin">
                        <span className="textoContagemEditorLaboratorioAdmin">
                            {perguntasLaboratorio.length === 1 ? '1 pergunta' : `${perguntasLaboratorio.length} perguntas`}
                        </span>
                        <button
                            type="submit"
                            className="botaoPrimarioFinancas"
                            disabled={salvandoLaboratorio}
                        >
                            {salvandoLaboratorio ? 'Salvando…' : 'Salvar'}
                        </button>
                    </div>
                </form>
            )}
        </ModalInferiorAdmin>
    );
}
