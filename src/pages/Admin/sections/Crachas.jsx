// Subaba "Crachás" da aba Pessoas: gera os crachás impressos de
// participantes (confirmados e pendentes), comissão e palestrantes.
//
// Fluxo: carrega a lista de GET /api/cracha, gera o QR (SVG) de cada uuid
// com a lib `qrcode` e monta folhas A4 com 9 crachás (3 × 3) e marcas de
// corte. "Imprimir" abre o diálogo do navegador — "Salvar como PDF" gera o
// arquivo da gráfica. As folhas ficam num portal no <body>, escondido na
// tela; no @media print só ele aparece (ver crachas.css).
//
// Todos os filtrados já vêm marcados; desmarcar tira da impressão (útil
// para reimprimir só quem perdeu o crachá).

import { useEffect, useMemo, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import QRCode from 'qrcode';
import { listarCrachas } from '../data/apiCracha.js';
import CrachaImpresso from './CrachaImpresso.jsx';
import './crachas.css';

const CRACHAS_POR_FOLHA = 9;
const COLUNAS_FOLHA_CRACHAS = 3;
const QUANTIDADE_PREVIA_CRACHAS = 6;

const URL_FONTE_ANTON = 'https://fonts.googleapis.com/css2?family=Anton&display=block';

const FILTROS_PERFIL_CRACHAS = [
    { id: 'TODOS', rotulo: 'Todos' },
    { id: 'PARTICIPANTE', rotulo: 'Participantes' },
    { id: 'COMISSAO', rotulo: 'Comissão' },
    { id: 'PALESTRANTE', rotulo: 'Palestrantes' },
];

const ROTULO_PERFIL_CRACHA = {
    PARTICIPANTE: 'Participante',
    COMISSAO: 'Comissão',
    PALESTRANTE: 'Palestrante',
};

// Pessoa e palestrante vêm de tabelas diferentes e os ids podem coincidir.
const chaveCracha = (pessoa) => `${pessoa.perfil}-${pessoa.id}`;

// Anton só é usada aqui: carrega sob demanda e espera ficar pronta, porque
// o tamanho do nome é medido com ela (CrachaImpresso.jsx).
async function carregarFonteAnton() {
    if (!document.querySelector(`link[href="${URL_FONTE_ANTON}"]`)) {
        const linkFonteAnton = document.createElement('link');
        linkFonteAnton.rel = 'stylesheet';
        linkFonteAnton.href = URL_FONTE_ANTON;
        document.head.appendChild(linkFonteAnton);
        await new Promise((resolver) => {
            linkFonteAnton.onload = resolver;
            linkFonteAnton.onerror = resolver;
        });
    }
    await document.fonts.load('100px Anton');
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
    const posicoesVerticaisMm = Array.from({ length: COLUNAS_FOLHA_CRACHAS + 1 }, (_, i) => i * 55);
    const posicoesHorizontaisMm = Array.from({ length: 4 }, (_, i) => i * 83.5);
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
    const [pessoas, setPessoas] = useState([]);
    const [svgsQrCodePorUuid, setSvgsQrCodePorUuid] = useState({});
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [filtroPerfil, setFiltroPerfil] = useState('TODOS');
    const [busca, setBusca] = useState('');
    const [chavesDesmarcadas, setChavesDesmarcadas] = useState(() => new Set());

    useEffect(() => {
        let ativo = true;
        (async () => {
            try {
                const [lista] = await Promise.all([listarCrachas(), carregarFonteAnton()]);
                const uuids = lista.map((pessoa) => pessoa.uuid).filter(Boolean);
                const svgs = await Promise.all(uuids.map(gerarSvgQrCode));
                if (!ativo) return;
                setSvgsQrCodePorUuid(Object.fromEntries(uuids.map((uuid, i) => [uuid, svgs[i]])));
                setPessoas(lista);
            } catch (e) {
                if (ativo) setErro(e.message);
            } finally {
                if (ativo) setCarregando(false);
            }
        })();
        return () => { ativo = false; };
    }, []);

    const pessoasFiltradas = useMemo(() => {
        const termoBusca = busca.trim().toLowerCase();
        return pessoas.filter((pessoa) =>
            (filtroPerfil === 'TODOS' || pessoa.perfil === filtroPerfil)
            && (!termoBusca || pessoa.nome.toLowerCase().includes(termoBusca)));
    }, [pessoas, filtroPerfil, busca]);

    const pessoasParaImprimir = pessoasFiltradas.filter((pessoa) => !chavesDesmarcadas.has(chaveCracha(pessoa)));
    const folhasCrachas = dividirEmFolhas(pessoasParaImprimir);
    const quantidadeSemQrCode = pessoasParaImprimir
        .filter((pessoa) => pessoa.perfil !== 'PALESTRANTE' && !pessoa.uuid).length;

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

    if (carregando) return <p class="estadoCarregandoParticipantesAdmin">Carregando crachás...</p>;
    if (erro) return <p class="avisoErroAdmin">{erro}</p>;

    return (
        <div class="conteudoParticipantesAdmin">
            <header class="cabecalhoSecaoFinancas">
                <div>
                    <h1 class="tituloSecaoFinancas">Crachás</h1>
                    <p class="subtituloSecaoFinancas">
                        Crachás impressos de 5,5 × 8,35 cm com o QR de check-in, 9 por folha A4
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
                    <div class="listaSubabasAdmin" role="tablist" aria-label="Filtrar por perfil">
                        {FILTROS_PERFIL_CRACHAS.map((filtro) => (
                            <button
                                key={filtro.id}
                                type="button"
                                role="tab"
                                aria-selected={filtroPerfil === filtro.id}
                                class={`botaoSubabaAdmin${filtroPerfil === filtro.id ? ' botaoSubabaAdminAtivo' : ''}`}
                                onClick={() => setFiltroPerfil(filtro.id)}
                            >
                                {filtro.rotulo}
                            </button>
                        ))}
                    </div>
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
                </div>

                <ul class="listaPessoasCrachas">
                    {pessoasFiltradas.length === 0 && (
                        <li class="tabelaVaziaAdmin">Ninguém encontrado.</li>
                    )}
                    {pessoasFiltradas.map((pessoa) => (
                        <li key={chaveCracha(pessoa)}>
                            <label class="itemPessoaCrachas">
                                <input
                                    type="checkbox"
                                    class="caixaSelecaoPessoaCrachas"
                                    checked={!chavesDesmarcadas.has(chaveCracha(pessoa))}
                                    onChange={() => alternarPessoa(pessoa)}
                                />
                                <span class="spanNomePessoaCrachas">{pessoa.nome}</span>
                                <span class="spanPerfilPessoaCrachas">{ROTULO_PERFIL_CRACHA[pessoa.perfil]}</span>
                                {pessoa.perfil !== 'PALESTRANTE' && !pessoa.uuid && (
                                    <span class="spanSemQrPessoaCrachas">sem QR</span>
                                )}
                            </label>
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
