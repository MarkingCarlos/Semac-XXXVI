// Seção "Início" do /admin — a primeira que o membro da comissão vê.
// Dá as boas-vindas pelo nome e deixa manter os dados do kit em dia:
// RA e, para cada camiseta que a pessoa já tem (pode ter mais de uma —
// a inclusa no kit e eventuais avulsas compradas à parte), o tipo e o
// tamanho são editáveis; e-mail e função são apenas exibidos. Cada
// camiseta tem sua própria prévia visual ao lado, que se atualiza ao
// vivo: a silhueta muda (Baby Look afunila na cintura; Normal é reto) e
// o tamanho é "estampado" no centro. Não dá pra adicionar nem remover
// camiseta por aqui — só o admin faz isso (ModalEditarCamisetas.jsx).
//
// Dados vêm de GET /api/pessoa/me e são salvos em PATCH /api/pessoa/me
// (o usuário é identificado pelo token — ver data/apiPerfil.js).

import { useState, useEffect } from 'preact/hooks';
import { Link } from 'wouter';
import { buscarPerfil, atualizarPerfil } from '../data/apiPerfil.js';
import './inicio.css';

const MODELOS = ['BABY_LOOK', 'NORMAL'];
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

const LABEL_MODELO = { BABY_LOOK: 'Baby Look', NORMAL: 'Normal' };

const LABEL_FUNCAO = {
    PARTICIPANTE: 'Participante',
    MEMBRO: 'Membro',
    DIRETOR_SITE: 'Diretor(a) de Site',
    DIRETOR_CONTEUDO: 'Diretor(a) de Conteúdo',
    DIRETOR_PATROCINIO: 'Diretor(a) de Patrocínio',
    DIRETOR_APOIO: 'Diretor(a) de Apoio',
    DIRETOR_MARKETING: 'Diretor(a) de Marketing',
    PRESIDENTE: 'Presidente',
};

// Silhuetas da camiseta por modelo. A forma encoda o tipo escolhido:
// NORMAL é reto/boxy; BABY_LOOK afunila na cintura e tem manga curta.
const SILHUETA_CAMISETA = {
    NORMAL: 'M65,42 L88,32 Q100,44 112,32 L135,42 L178,66 L162,92 L146,84 L146,178 L54,178 L54,84 L38,92 L22,66 Z',
    BABY_LOOK: 'M70,44 L90,34 Q100,45 110,34 L130,44 L166,62 L154,86 L140,80 Q136,120 138,178 Q100,186 62,178 Q64,120 60,80 L46,86 L34,62 Z',
};

// Prévia visual da camiseta SEMAC — reflete modelo (forma) e tamanho (letra).
function PreviaCamiseta({ modelo, tamanho }) {
    return (
        <div className="previaCamisetaInicio">
            <svg
                className="svgCamisetaInicio"
                viewBox="0 0 200 210"
                role="img"
                aria-label={`Prévia da camiseta ${LABEL_MODELO[modelo]}, tamanho ${tamanho}`}
            >
                <path className="corpoCamisetaInicio" d={SILHUETA_CAMISETA[modelo]} />
                <path className="golaCamisetaInicio" d="M84,40 Q100,54 116,40" />
                {/* Tamanhos de 2 e 3 letras (GG, XXG) precisam encolher para
                    caber dentro da silhueta. `text-anchor` em kebab-case:
                    camelCase não chega ao SVG. */}
                <text
                    className={`letraTamanhoCamisetaInicio letraTamanhoCamiseta${tamanho.length}Inicio`}
                    x="100"
                    y="140"
                    text-anchor="middle"
                >
                    {tamanho}
                </text>
            </svg>
            <span className="legendaCamisetaInicio">
                {LABEL_MODELO[modelo]} · Tamanho {tamanho}
            </span>
        </div>
    );
}

// Uma camiseta editável: seletores de modelo/tamanho + prévia própria.
// `avulsa` é só exibido (etiqueta) — quem marca isso é o admin.
function LinhaCamisetaInicio({ camiseta, indice, aoAlterarCampo, desabilitado, ehComissao }) {
    // Para a comissão, "avulsa" não significa compra à parte (ela não paga
    // pelo kit) — é o modelo de camiseta de participante, já que só a
    // inclusa é o benefício exclusivo da função (mesma regra de
    // RelatorioService.relatorioCamisetas). Por isso o rótulo muda.
    const rotuloOrigem = camiseta.avulsa
        ? (ehComissao ? 'Participante' : 'Avulsa')
        : 'Inclusa no kit';

    return (
        <div className="linhaCamisetaInicio">
            <div className="controlesLinhaCamisetaInicio">
                <div className="cabecalhoLinhaCamisetaInicio">
                    <span className="indiceLinhaCamisetaInicio">Camiseta {indice + 1}</span>
                    <span
                        className={`etiquetaOrigemLinhaCamisetaInicio ${camiseta.avulsa ? 'etiquetaOrigemAvulsaLinhaCamisetaInicio' : 'etiquetaOrigemInclusaLinhaCamisetaInicio'}`}
                    >
                        {rotuloOrigem}
                    </span>
                </div>

                <div className="grupoCamisetaInicio">
                    <span className="rotuloCampoFinancas">Tipo de camiseta</span>
                    <div className="opcoesModeloInicio">
                        {MODELOS.map((opcao) => (
                            <button
                                key={opcao}
                                type="button"
                                className={`botaoModeloInicio ${camiseta.modelo === opcao ? 'botaoModeloAtivoInicio' : ''}`}
                                aria-pressed={camiseta.modelo === opcao}
                                disabled={desabilitado}
                                onClick={() => aoAlterarCampo(indice, 'modelo', opcao)}
                            >
                                {LABEL_MODELO[opcao]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grupoCamisetaInicio">
                    <span className="rotuloCampoFinancas">Tamanho</span>
                    <div className="opcoesTamanhoInicio">
                        {TAMANHOS.map((opcao) => (
                            <button
                                key={opcao}
                                type="button"
                                className={`botaoTamanhoInicio ${camiseta.tamanho === opcao ? 'botaoTamanhoAtivoInicio' : ''}`}
                                aria-pressed={camiseta.tamanho === opcao}
                                disabled={desabilitado}
                                onClick={() => aoAlterarCampo(indice, 'tamanho', opcao)}
                            >
                                {opcao}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <PreviaCamiseta modelo={camiseta.modelo} tamanho={camiseta.tamanho} />
        </div>
    );
}

export default function Inicio({ podeAcessarFinanceiro = false }) {
    const [perfil, setPerfil] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregar, setErroCarregar] = useState('');

    const [ra, setRa] = useState('');
    const [camisetas, setCamisetas] = useState([]);

    const [salvando, setSalvando] = useState(false);
    const [erroSalvar, setErroSalvar] = useState('');
    const [sucesso, setSucesso] = useState(false);

    // Aplica os dados carregados (ou recém-salvos) como base do formulário.
    function aplicarPerfil(dados) {
        setPerfil(dados);
        setRa(dados.ra ?? '');
        setCamisetas((dados.camisetas ?? []).map(c => ({ ...c })));
    }

    useEffect(() => {
        let ativo = true;
        buscarPerfil()
            .then((dados) => { if (ativo && dados) aplicarPerfil(dados); })
            .catch(() => { if (ativo) setErroCarregar('Não foi possível carregar seu perfil. Tente recarregar a página.'); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    function alterarCampoCamiseta(indice, campo, valor) {
        setCamisetas(camisetas.map((c, i) => (i === indice ? { ...c, [campo]: valor } : c)));
    }

    const baseRa = perfil?.ra ?? '';
    const baseCamisetas = perfil?.camisetas ?? [];
    const camisetasAlteraram = camisetas.some((c, i) => {
        const base = baseCamisetas[i];
        return !base || c.modelo !== base.modelo || c.tamanho !== base.tamanho;
    });
    const alterou = ra.trim() !== baseRa || camisetasAlteraram;

    async function salvar(e) {
        e.preventDefault();
        if (!alterou || salvando) return;
        setSalvando(true);
        setErroSalvar('');
        setSucesso(false);
        try {
            const atualizado = await atualizarPerfil({
                ra,
                camisetas: camisetas.map(({ id, modelo, tamanho }) => ({ id, modelo, tamanho })),
            });
            if (atualizado) {
                aplicarPerfil(atualizado);
                setSucesso(true);
                setTimeout(() => setSucesso(false), 2600);
            }
        } catch (erro) {
            setErroSalvar(erro.message);
        } finally {
            setSalvando(false);
        }
    }

    if (carregando) {
        return <p className="estadoCarregandoInicio">Carregando seu perfil...</p>;
    }

    if (erroCarregar) {
        return <p className="avisoErroAdmin">{erroCarregar}</p>;
    }

    const primeiroNome = perfil.nome.trim().split(/\s+/)[0];
    const funcao = LABEL_FUNCAO[perfil.role] ?? 'Comissão';

    return (
        <div className="conteudoInicio">
            <header className="cabecalhoBoasVindasInicio">
                <span className="eyebrowPerfilInicio">
                    Perfil<span className="separadorEyebrowInicio">/</span>{funcao}
                </span>
                <p className="saudacaoInicio">Bem-vindo,</p>
                <div className="linhaNomeCardInicio">
                    <h1 className="nomeBoasVindasInicio">{primeiroNome}</h1>
                    {podeAcessarFinanceiro && (
                        <Link href="/financeiro" className="cartaoIrFinanceiroInicio">
                            <span className="tituloCartaoIrFinanceiroInicio">Ir para o financeiro</span>
                            <span className="subtituloCartaoIrFinanceiroInicio">Acessar o painel financeiro da SEMAC</span>
                        </Link>
                    )}
                </div>
                <p className="emailUsuarioInicio">{perfil.email}</p>
            </header>

            <form className="formularioPerfilInicio" onSubmit={salvar}>
                <p className="divisorFormularioFinancas">Seu kit SEMAC</p>

                <div className="campoFormularioFinancas">
                    <label className="rotuloCampoFinancas" htmlFor="campoRaInicio">RA</label>
                    <input
                        id="campoRaInicio"
                        className="entradaFormularioFinancas"
                        inputMode="numeric"
                        placeholder="Seu registro acadêmico"
                        value={ra}
                        onInput={(e) => setRa(e.currentTarget.value)}
                    />
                </div>

                {camisetas.length === 0 ? (
                    <p className="vazioCamisetasInicio">Nenhuma camiseta cadastrada.</p>
                ) : (
                    <div className="listaCamisetasInicio">
                        {camisetas.map((camiseta, indice) => (
                            <LinhaCamisetaInicio
                                key={camiseta.id}
                                camiseta={camiseta}
                                indice={indice}
                                aoAlterarCampo={alterarCampoCamiseta}
                                desabilitado={salvando}
                                ehComissao={perfil.role !== 'PARTICIPANTE'}
                            />
                        ))}
                    </div>
                )}

                {erroSalvar && <p className="avisoErroInicio">{erroSalvar}</p>}

                <div className="rodapePerfilInicio">
                    <button
                        type="submit"
                        className="botaoPrimarioFinancas"
                        disabled={!alterou || salvando}
                    >
                        {salvando ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                    <span
                        className={`avisoSucessoInicio ${sucesso ? 'avisoSucessoVisivelInicio' : ''}`}
                        role="status"
                        aria-live="polite"
                    >
                        {sucesso ? 'Alterações salvas' : ''}
                    </span>
                </div>
            </form>
        </div>
    );
}
