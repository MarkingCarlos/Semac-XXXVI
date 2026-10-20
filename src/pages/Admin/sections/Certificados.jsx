// Subaba "Certificados" da aba Pessoas: gera os certificados dos
// palestrantes, um por palestrante em cada evento que ministrou (palestra,
// minicurso, mesa redonda...). Evento com vários palestrantes dá um
// certificado para cada um.
//
// Fluxo: carrega a lista de GET /api/certificado e, ao clicar, monta o PDF
// no navegador sobre o modelo (gerarPdfCertificados.js). "Baixar
// selecionados" junta todos num arquivo só, uma página A4 por certificado;
// cada linha tem "Ver" (prévia aqui embaixo) e "Baixar" (só aquele).
//
// O gerador (e o pdf-lib, que é pesado) só é carregado no primeiro clique.

import { useEffect, useMemo, useState } from 'preact/hooks';
import { listarCertificados } from '../data/apiCertificado.js';
import './certificados.css';

const ROTULO_TIPO_EVENTO_CERTIFICADO = {
    PALESTRA: 'Palestra',
    MINICURSO: 'Minicurso',
    MESA_REDONDA: 'Mesa redonda',
    DEBATE: 'Debate',
    MOSTRA_TECNICA: 'Mostra técnica',
};

const chaveCertificado = (certificado) => `${certificado.palestranteId}-${certificado.eventoId}`;

const carregarGeradorCertificados = () => import('./gerarPdfCertificados.js');

function dataCurtaCertificado(dataHora) {
    const [, mes, dia] = dataHora.slice(0, 10).split('-');
    return `${dia}/${mes}`;
}

export default function Certificados() {
    const [certificados, setCertificados] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [busca, setBusca] = useState('');
    const [chavesDesmarcadas, setChavesDesmarcadas] = useState(() => new Set());
    const [chaveGerando, setChaveGerando] = useState(null);
    const [previaCertificado, setPreviaCertificado] = useState(null);

    useEffect(() => {
        let ativo = true;
        listarCertificados()
            .then((lista) => { if (ativo) setCertificados(lista); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    // Solta o blob da prévia anterior ao trocar ou sair da subaba.
    useEffect(() => () => {
        if (previaCertificado) URL.revokeObjectURL(previaCertificado.url);
    }, [previaCertificado]);

    const certificadosFiltrados = useMemo(() => {
        const termoBusca = busca.trim().toLowerCase();
        if (!termoBusca) return certificados;
        return certificados.filter((certificado) =>
            certificado.nomePalestrante.toLowerCase().includes(termoBusca)
            || certificado.nomeEvento.toLowerCase().includes(termoBusca));
    }, [certificados, busca]);

    const certificadosSelecionados = certificadosFiltrados
        .filter((certificado) => !chavesDesmarcadas.has(chaveCertificado(certificado)));
    const quantidadePalestrantes = new Set(certificados.map((certificado) => certificado.palestranteId)).size;

    function alternarCertificado(certificado) {
        setChavesDesmarcadas((anteriores) => {
            const novas = new Set(anteriores);
            const chave = chaveCertificado(certificado);
            if (novas.has(chave)) novas.delete(chave);
            else novas.add(chave);
            return novas;
        });
    }

    function marcarFiltrados(marcar) {
        setChavesDesmarcadas((anteriores) => {
            const novas = new Set(anteriores);
            for (const certificado of certificadosFiltrados) {
                if (marcar) novas.delete(chaveCertificado(certificado));
                else novas.add(chaveCertificado(certificado));
            }
            return novas;
        });
    }

    // `chave` identifica o botão que mostra "Gerando..." enquanto o PDF sai.
    async function gerar(chave, lista, aoGerar) {
        setChaveGerando(chave);
        setErro('');
        try {
            const gerador = await carregarGeradorCertificados();
            aoGerar(gerador, await gerador.gerarPdfCertificados(lista));
        } catch (e) {
            setErro(e.message || 'Não foi possível gerar o certificado.');
        } finally {
            setChaveGerando(null);
        }
    }

    function baixarSelecionados() {
        gerar('todos', certificadosSelecionados, (gerador, blob) =>
            gerador.baixarArquivo(blob, 'Certificados palestrantes - XXXVI SEMAC.pdf'));
    }

    function baixarIndividual(certificado) {
        gerar(`baixar-${chaveCertificado(certificado)}`, [certificado], (gerador, blob) =>
            gerador.baixarArquivo(blob, gerador.nomeArquivoCertificado(certificado)));
    }

    function verPrevia(certificado) {
        gerar(`ver-${chaveCertificado(certificado)}`, [certificado], (_, blob) =>
            setPreviaCertificado({ chave: chaveCertificado(certificado), url: URL.createObjectURL(blob) }));
    }

    if (carregando) return <p class="estadoCarregandoParticipantesAdmin">Carregando certificados...</p>;

    return (
        <div class="conteudoParticipantesAdmin">
            <header class="cabecalhoSecaoFinancas">
                <div>
                    <h1 class="tituloSecaoFinancas">Certificados</h1>
                    <p class="subtituloSecaoFinancas">
                        Um certificado A4 por palestrante em cada evento — {certificados.length} certificado(s)
                        de {quantidadePalestrantes} palestrante(s)
                    </p>
                </div>
                <button
                    type="button"
                    class="botaoPrimarioFinancas"
                    disabled={certificadosSelecionados.length === 0 || chaveGerando !== null}
                    onClick={baixarSelecionados}
                >
                    {chaveGerando === 'todos'
                        ? 'Gerando PDF...'
                        : `Baixar ${certificadosSelecionados.length} em um PDF`}
                </button>
            </header>

            {erro && <p class="avisoErroAdmin">{erro}</p>}

            <div class="conteinerTabelaAdmin">
                <div class="topoTabelaAdmin controlesListaCertificados">
                    <input
                        class="inputBuscaAdmin"
                        type="text"
                        placeholder="Buscar por palestrante ou evento..."
                        value={busca}
                        onInput={(e) => setBusca(e.currentTarget.value)}
                    />
                    <button type="button" class="botaoFantasmaFinancas" onClick={() => marcarFiltrados(true)}>
                        Marcar todos
                    </button>
                    <button type="button" class="botaoFantasmaFinancas" onClick={() => marcarFiltrados(false)}>
                        Desmarcar todos
                    </button>
                </div>

                <ul class="listaCertificados">
                    {certificadosFiltrados.length === 0 && (
                        <li class="tabelaVaziaAdmin">
                            {certificados.length === 0
                                ? 'Nenhum evento tem palestrante cadastrado ainda.'
                                : 'Nada encontrado.'}
                        </li>
                    )}
                    {certificadosFiltrados.map((certificado) => {
                        const chave = chaveCertificado(certificado);
                        return (
                            <li key={chave} class="itemCertificados">
                                <input
                                    type="checkbox"
                                    class="caixaSelecaoCertificados"
                                    aria-label={`Incluir ${certificado.nomePalestrante} — ${certificado.nomeEvento}`}
                                    checked={!chavesDesmarcadas.has(chave)}
                                    onChange={() => alternarCertificado(certificado)}
                                />
                                <div class="divTextosItemCertificados">
                                    <span class="spanNomePalestranteCertificados">{certificado.nomePalestrante}</span>
                                    <span class="spanEventoCertificados">
                                        {ROTULO_TIPO_EVENTO_CERTIFICADO[certificado.codigoTipoEvento] ?? 'Atividade'}
                                        {' · '}{dataCurtaCertificado(certificado.dataHoraInicio)}
                                        {' · '}{certificado.nomeEvento}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    class="botaoFantasmaFinancas"
                                    disabled={chaveGerando !== null}
                                    onClick={() => verPrevia(certificado)}
                                >
                                    {chaveGerando === `ver-${chave}` ? 'Gerando...' : 'Ver'}
                                </button>
                                <button
                                    type="button"
                                    class="botaoFantasmaFinancas"
                                    disabled={chaveGerando !== null}
                                    onClick={() => baixarIndividual(certificado)}
                                >
                                    {chaveGerando === `baixar-${chave}` ? 'Gerando...' : 'Baixar'}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {previaCertificado && (
                <div class="blocoPreviaCertificados">
                    <div class="topoPreviaCertificados">
                        <h2 class="tituloTabelaAdmin">Prévia</h2>
                        <button type="button" class="botaoFantasmaFinancas" onClick={() => setPreviaCertificado(null)}>
                            Fechar
                        </button>
                    </div>
                    <iframe
                        key={previaCertificado.chave}
                        class="iframePreviaCertificados"
                        src={previaCertificado.url}
                        title="Prévia do certificado"
                    />
                </div>
            )}
        </div>
    );
}
