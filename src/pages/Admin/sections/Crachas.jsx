// Subaba "Crachás" da aba Pessoas: gera os crachás impressos de
// participantes (confirmados e pendentes), comissão, palestrantes e
// professores convidados.
//
// Fluxo: carrega a lista de GET /api/cracha, gera o QR (SVG) de cada uuid
// com a lib `qrcode` e monta folhas A4 com 9 crachás (3 × 3) e marcas de
// corte. "Imprimir" abre o diálogo do navegador — "Salvar como PDF" gera o
// arquivo da gráfica. As folhas ficam num portal no <body>, escondido na
// tela; no @media print só ele aparece (ver crachas.css).
//
// Todos os filtrados já vêm marcados; desmarcar tira da impressão (útil
// para reimprimir só quem perdeu o crachá).
//
// Professores convidados não têm conta: são cadastrados aqui mesmo (nome +
// gênero, que decide o rótulo PROFESSOR/PROFESSORA) e vêm de
// /api/professor-convidado, juntados à lista de /api/cracha no navegador.

import { useEffect, useMemo, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import QRCode from 'qrcode';
import {
    listarCrachas,
    listarProfessoresConvidados,
    criarProfessorConvidado,
    atualizarProfessorConvidado,
    excluirProfessorConvidado,
} from '../data/apiCracha.js';
import CrachaImpresso from './CrachaImpresso.jsx';
import PainelLateral from '../../Financas/components/PainelLateral.jsx';
import SeletorModalSubabas from '../../../components/SeletorModalSubabas/SeletorModalSubabas.jsx';
import './crachas.css';

const CRACHAS_POR_FOLHA = 9;
const COLUNAS_FOLHA_CRACHAS = 3;
const QUANTIDADE_PREVIA_CRACHAS = 6;

const URL_FONTES_CRACHA = 'https://fonts.googleapis.com/css2?family=Anton&family=Bungee&display=block';

const FILTROS_PERFIL_CRACHAS = [
    { id: 'TODOS', rotulo: 'Todos' },
    { id: 'PARTICIPANTE', rotulo: 'Participantes' },
    { id: 'COMISSAO', rotulo: 'Comissão' },
    { id: 'PALESTRANTE', rotulo: 'Palestrantes' },
    { id: 'PROFESSOR', rotulo: 'Professores' },
];

const ROTULO_PERFIL_CRACHA = {
    PARTICIPANTE: 'Participante',
    COMISSAO: 'Comissão',
    PALESTRANTE: 'Palestrante',
    PROFESSOR: 'Professor',
};

const FORMULARIO_VAZIO_PROFESSOR_CRACHAS = { nome: '', genero: 'M' };

const rotuloPerfilListaCrachas = (pessoa) =>
    (pessoa.perfil === 'PROFESSOR' && pessoa.genero === 'F' ? 'Professora' : ROTULO_PERFIL_CRACHA[pessoa.perfil]);

// No formato da lista de /api/cracha; professor não tem QR.
const professorParaCracha = (professor) => ({ ...professor, uuid: null, perfil: 'PROFESSOR' });

// Pessoa, palestrante e professor vêm de tabelas diferentes e os ids podem coincidir.
const chaveCracha = (pessoa) => `${pessoa.perfil}-${pessoa.id}`;

// Anton (participante) e Bungee (comissão/palestrante) só são usadas aqui:
// carrega sob demanda e espera ficarem prontas, porque o tamanho do nome é
// medido com elas (CrachaImpresso.jsx).
async function carregarFontesCracha() {
    if (!document.querySelector(`link[href="${URL_FONTES_CRACHA}"]`)) {
        const linkFontesCracha = document.createElement('link');
        linkFontesCracha.rel = 'stylesheet';
        linkFontesCracha.href = URL_FONTES_CRACHA;
        document.head.appendChild(linkFontesCracha);
        await new Promise((resolver) => {
            linkFontesCracha.onload = resolver;
            linkFontesCracha.onerror = resolver;
        });
    }
    await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('100px Bungee')]);
}

// QR em preto com fundo transparente: o cinza da arte faz a zona de
// silêncio e o contraste fica máximo para o leitor do check-in.
function gerarSvgQrCode(uuid) {
    return QRCode.toString(uuid, {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#00000000' },
    });
}

function dividirEmFolhas(lista) {
    const folhas = [];
    for (let i = 0; i < lista.length; i += CRACHAS_POR_FOLHA) folhas.push(lista.slice(i, i + CRACHAS_POR_FOLHA));
    return folhas;
}

// Marcas de corte na margem da folha, prolongando as linhas da grade.
function MarcasCorteFolhaCrachas() {
    const posicoesVerticaisMm = Array.from({ length: COLUNAS_FOLHA_CRACHAS + 1 }, (_, i) => i * 60);
    const posicoesHorizontaisMm = Array.from({ length: 4 }, (_, i) => i * 91.09);
    return (
        <>
            {posicoesVerticaisMm.map((x) => (
                <span key={`v${x}`}>
                    <span class="marcaCorteVerticalTopoFolhaCrachas" style={{ left: `${x}mm` }} />
                    <span class="marcaCorteVerticalBaseFolhaCrachas" style={{ left: `${x}mm` }} />
                </span>
            ))}
            {posicoesHorizontaisMm.map((y) => (
                <span key={`h${y}`}>
                    <span class="marcaCorteHorizontalEsquerdaFolhaCrachas" style={{ top: `${y}mm` }} />
                    <span class="marcaCorteHorizontalDireitaFolhaCrachas" style={{ top: `${y}mm` }} />
                </span>
            ))}
        </>
    );
}

export default function Crachas() {
    const [pessoasCracha, setPessoasCracha] = useState([]);
    const [professores, setProfessores] = useState([]);
    const [svgsQrCodePorUuid, setSvgsQrCodePorUuid] = useState({});
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [filtroPerfil, setFiltroPerfil] = useState('TODOS');
    const [busca, setBusca] = useState('');
    const [chavesDesmarcadas, setChavesDesmarcadas] = useState(() => new Set());

    const [painelProfessorAberto, setPainelProfessorAberto] = useState(false);
    const [formularioProfessor, setFormularioProfessor] = useState(FORMULARIO_VAZIO_PROFESSOR_CRACHAS);
    const [idProfessorEmEdicao, setIdProfessorEmEdicao] = useState(null);
    const [idProfessorConfirmandoExclusao, setIdProfessorConfirmandoExclusao] = useState(null);
    const [salvandoProfessor, setSalvandoProfessor] = useState(false);
    const [erroProfessor, setErroProfessor] = useState('');

    useEffect(() => {
        let ativo = true;
        (async () => {
            try {
                const [lista, listaProfessores] = await Promise.all([
                    listarCrachas(),
                    listarProfessoresConvidados(),
                    carregarFontesCracha(),
                ]);
                const uuids = lista.map((pessoa) => pessoa.uuid).filter(Boolean);
                const svgs = await Promise.all(uuids.map(gerarSvgQrCode));
                if (!ativo) return;
                setSvgsQrCodePorUuid(Object.fromEntries(uuids.map((uuid, i) => [uuid, svgs[i]])));
                setPessoasCracha(lista);
                setProfessores(listaProfessores);
            } catch (e) {
                if (ativo) setErro(e.message);
            } finally {
                if (ativo) setCarregando(false);
            }
        })();
        return () => { ativo = false; };
    }, []);

    const pessoas = useMemo(() => [...pessoasCracha, ...professores.map(professorParaCracha)]
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })),
    [pessoasCracha, professores]);

    const pessoasFiltradas = useMemo(() => {
        const termoBusca = busca.trim().toLowerCase();
        return pessoas.filter((pessoa) =>
            (filtroPerfil === 'TODOS' || pessoa.perfil === filtroPerfil)
            && (!termoBusca || pessoa.nome.toLowerCase().includes(termoBusca)));
    }, [pessoas, filtroPerfil, busca]);

    const pessoasParaImprimir = pessoasFiltradas.filter((pessoa) => !chavesDesmarcadas.has(chaveCracha(pessoa)));
    const folhasCrachas = dividirEmFolhas(pessoasParaImprimir);
    const quantidadeSemQrCode = pessoasParaImprimir
        .filter((pessoa) => pessoa.perfil === 'PARTICIPANTE' && !pessoa.uuid).length;

    function alternarPessoa(pessoa) {
        setChavesDesmarcadas((anteriores) => {
            const novas = new Set(anteriores);
            const chave = chaveCracha(pessoa);
            if (novas.has(chave)) novas.delete(chave);
            else novas.add(chave);
            return novas;
        });
    }

    function marcarFiltradas(marcar) {
        setChavesDesmarcadas((anteriores) => {
            const novas = new Set(anteriores);
            for (const pessoa of pessoasFiltradas) {
                if (marcar) novas.delete(chaveCracha(pessoa));
                else novas.add(chaveCracha(pessoa));
            }
            return novas;
        });
    }

    function abrirNovoProfessor() {
        setFormularioProfessor(FORMULARIO_VAZIO_PROFESSOR_CRACHAS);
        setIdProfessorEmEdicao(null);
        setErroProfessor('');
        setPainelProfessorAberto(true);
    }

    function abrirEdicaoProfessor(professor) {
        setFormularioProfessor({ nome: professor.nome, genero: professor.genero });
        setIdProfessorEmEdicao(professor.id);
        setErroProfessor('');
        setPainelProfessorAberto(true);
    }

    async function salvarProfessor(evento) {
        evento.preventDefault();
        setSalvandoProfessor(true);
        setErroProfessor('');
        try {
            if (idProfessorEmEdicao !== null) {
                const atualizado = await atualizarProfessorConvidado(idProfessorEmEdicao, formularioProfessor);
                setProfessores((anteriores) => anteriores.map((p) => (p.id === idProfessorEmEdicao ? atualizado : p)));
            } else {
                const criado = await criarProfessorConvidado(formularioProfessor);
                setProfessores((anteriores) => [...anteriores, criado]);
            }
            setPainelProfessorAberto(false);
        } catch (e) {
            setErroProfessor(e.message);
        } finally {
            setSalvandoProfessor(false);
        }
    }

    // Primeiro clique arma, o segundo exclui (mesmo padrão de Brindes).
    async function removerProfessor(id) {
        if (idProfessorConfirmandoExclusao !== id) {
            setIdProfessorConfirmandoExclusao(id);
            return;
        }
        setErroProfessor('');
        try {
            await excluirProfessorConvidado(id);
            setProfessores((anteriores) => anteriores.filter((p) => p.id !== id));
        } catch (e) {
            setErroProfessor(e.message);
        } finally {
            setIdProfessorConfirmandoExclusao(null);
        }
    }

    if (carregando) return <p class="estadoCarregandoParticipantesAdmin">Carregando crachás...</p>;
    if (erro) return <p class="avisoErroAdmin">{erro}</p>;

    return (
        <div class="conteudoParticipantesAdmin">
            <header class="cabecalhoSecaoFinancas">
                <div>
                    <h1 class="tituloSecaoFinancas">Crachás</h1>
                    <p class="subtituloSecaoFinancas">
                        Crachás impressos de 6 × 9,11 cm com o QR de check-in, 9 por folha A4
                    </p>
                </div>
                <button
                    type="button"
                    class="botaoPrimarioFinancas"
                    disabled={pessoasParaImprimir.length === 0}
                    onClick={() => window.print()}
                >
                    Imprimir {pessoasParaImprimir.length} crachá(s)
                </button>
            </header>

            <p class="resumoImpressaoCrachas">
                {pessoasParaImprimir.length} selecionado(s) · {folhasCrachas.length} folha(s) A4.
                Na janela de impressão, escolha <strong>Salvar como PDF</strong>, margens
                <strong> Nenhuma</strong> e escala <strong>100%</strong>.
            </p>
            {quantidadeSemQrCode > 0 && (
                <p class="avisoErroAdmin">
                    {quantidadeSemQrCode} pessoa(s) selecionada(s) sem código de check-in — o crachá sai sem QR.
                </p>
            )}

            <div class="conteinerTabelaAdmin">
                <div class="topoTabelaAdmin controlesListaCrachas">
                    {/* Pílulas no desktop; no mobile, uma pílula só que abre um modal de baixo para cima. */}
                    <SeletorModalSubabas
                        subabas={FILTROS_PERFIL_CRACHAS}
                        subabaAtiva={filtroPerfil}
                        aoTrocar={setFiltroPerfil}
                        tituloModal="Filtrar por perfil"
                        rotuloAcessivel="Filtrar por perfil"
                    />
                    <input
                        class="inputBuscaAdmin"
                        type="text"
                        placeholder="Buscar por nome..."
                        value={busca}
                        onInput={(e) => setBusca(e.currentTarget.value)}
                    />
                    <button type="button" class="botaoFantasmaFinancas" onClick={() => marcarFiltradas(true)}>
                        Marcar todos
                    </button>
                    <button type="button" class="botaoFantasmaFinancas" onClick={() => marcarFiltradas(false)}>
                        Desmarcar todos
                    </button>
                    <button type="button" class="botaoFantasmaFinancas" onClick={abrirNovoProfessor}>
                        + Adicionar professor(a)
                    </button>
                </div>

                {erroProfessor && !painelProfessorAberto && (
                    <p class="avisoErroAdmin" role="alert">{erroProfessor}</p>
                )}

                <ul class="listaPessoasCrachas">
                    {pessoasFiltradas.length === 0 && (
                        <li class="tabelaVaziaAdmin">Ninguém encontrado.</li>
                    )}
                    {pessoasFiltradas.map((pessoa) => (
                        <li key={chaveCracha(pessoa)} class="linhaPessoaCrachas">
                            <label class="itemPessoaCrachas">
                                <input
                                    type="checkbox"
                                    class="caixaSelecaoPessoaCrachas"
                                    checked={!chavesDesmarcadas.has(chaveCracha(pessoa))}
                                    onChange={() => alternarPessoa(pessoa)}
                                />
                                <span class="spanNomePessoaCrachas">{pessoa.nome}</span>
                                <span class="spanPerfilPessoaCrachas">{rotuloPerfilListaCrachas(pessoa)}</span>
                                {pessoa.perfil === 'PARTICIPANTE' && !pessoa.uuid && (
                                    <span class="spanSemQrPessoaCrachas">sem QR</span>
                                )}
                            </label>
                            {/* Fora do <label>: clicar aqui não marca/desmarca o crachá. */}
                            {pessoa.perfil === 'PROFESSOR' && (
                                <div class="grupoAcoesLinhaFinancas acoesProfessorCrachas">
                                    <button
                                        type="button"
                                        class="botaoAcaoLinhaFinancas"
                                        aria-label={`Editar professor(a) ${pessoa.nome}`}
                                        title="Editar"
                                        onClick={() => abrirEdicaoProfessor(pessoa)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        class={
                                            idProfessorConfirmandoExclusao === pessoa.id
                                                ? 'botaoAcaoLinhaFinancas botaoConfirmarExclusaoFinancas'
                                                : 'botaoAcaoLinhaFinancas'
                                        }
                                        aria-label={
                                            idProfessorConfirmandoExclusao === pessoa.id
                                                ? `Confirmar exclusão de ${pessoa.nome}`
                                                : `Excluir professor(a) ${pessoa.nome}`
                                        }
                                        title={
                                            idProfessorConfirmandoExclusao === pessoa.id
                                                ? 'Clique novamente para confirmar'
                                                : 'Excluir'
                                        }
                                        onClick={() => removerProfessor(pessoa.id)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {pessoasParaImprimir.length > 0 && (
                <div class="blocoPreviaCrachas">
                    <h2 class="tituloTabelaAdmin">Prévia (tamanho real)</h2>
                    <div class="gradePreviaCrachas">
                        {pessoasParaImprimir.slice(0, QUANTIDADE_PREVIA_CRACHAS).map((pessoa) => (
                            <CrachaImpresso
                                key={chaveCracha(pessoa)}
                                pessoa={pessoa}
                                svgQrCode={svgsQrCodePorUuid[pessoa.uuid]}
                            />
                        ))}
                    </div>
                </div>
            )}

            <PainelLateral
                aberto={painelProfessorAberto}
                titulo={idProfessorEmEdicao !== null ? 'Editar professor(a)' : 'Novo(a) professor(a)'}
                aoFechar={() => setPainelProfessorAberto(false)}
            >
                <form class="formularioFinancas" onSubmit={salvarProfessor}>
                    <div class="campoFormularioFinancas">
                        <label class="rotuloCampoFinancas" htmlFor="campoNomeProfessorCrachas">Nome *</label>
                        <input
                            id="campoNomeProfessorCrachas"
                            class="entradaFormularioFinancas"
                            required
                            value={formularioProfessor.nome}
                            onInput={(e) => setFormularioProfessor({ ...formularioProfessor, nome: e.currentTarget.value })}
                        />
                    </div>

                    <fieldset class="campoFormularioFinancas grupoGeneroProfessorCrachas">
                        <legend class="rotuloCampoFinancas">Rótulo do crachá *</legend>
                        <label class="opcaoGeneroProfessorCrachas">
                            <input
                                type="radio"
                                name="generoProfessorCrachas"
                                value="M"
                                checked={formularioProfessor.genero === 'M'}
                                onChange={() => setFormularioProfessor({ ...formularioProfessor, genero: 'M' })}
                            />
                            Masculino — PROFESSOR
                        </label>
                        <label class="opcaoGeneroProfessorCrachas">
                            <input
                                type="radio"
                                name="generoProfessorCrachas"
                                value="F"
                                checked={formularioProfessor.genero === 'F'}
                                onChange={() => setFormularioProfessor({ ...formularioProfessor, genero: 'F' })}
                            />
                            Feminino — PROFESSORA
                        </label>
                    </fieldset>

                    {erroProfessor && <p class="avisoErroAdmin" role="alert">{erroProfessor}</p>}

                    <div class="rodapeFormularioFinancas">
                        <button type="button" class="botaoFantasmaFinancas" onClick={() => setPainelProfessorAberto(false)}>
                            Cancelar
                        </button>
                        <button type="submit" class="botaoPrimarioFinancas" disabled={salvandoProfessor}>
                            {salvandoProfessor
                                ? 'Salvando…'
                                : idProfessorEmEdicao !== null
                                    ? 'Salvar alterações'
                                    : 'Adicionar'}
                        </button>
                    </div>
                </form>
            </PainelLateral>

            {createPortal(
                <div class="portalImpressaoCrachas">
                    {folhasCrachas.map((folha, indiceFolha) => (
                        <div key={indiceFolha} class="folhaA4Crachas">
                            <div class="gradeFolhaCrachas">
                                {folha.map((pessoa) => (
                                    <CrachaImpresso
                                        key={chaveCracha(pessoa)}
                                        pessoa={pessoa}
                                        svgQrCode={svgsQrCodePorUuid[pessoa.uuid]}
                                    />
                                ))}
                                <MarcasCorteFolhaCrachas />
                            </div>
                        </div>
                    ))}
                </div>,
                document.body,
            )}
        </div>
    );
}
