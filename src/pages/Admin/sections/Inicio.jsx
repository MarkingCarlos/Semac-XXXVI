// Seção "Início" do /admin — a primeira que o membro da comissão vê.
// Dá as boas-vindas pelo nome e deixa manter os dados do kit em dia:
// RA, tipo e tamanho da camiseta são editáveis; e-mail e função são
// apenas exibidos. A prévia da camiseta à direita se atualiza ao vivo:
// a silhueta muda (Baby Look afunila na cintura; Normal é reto) e o
// tamanho é "estampado" no centro.
//
// Dados vêm de GET /api/pessoa/me e são salvos em PATCH /api/pessoa/me
// (o usuário é identificado pelo token — ver data/apiPerfil.js).

import { useState, useEffect } from 'preact/hooks';
import { buscarPerfil, atualizarPerfil } from '../data/apiPerfil.js';
import './inicio.css';

const MODELOS = ['BABY_LOOK', 'NORMAL'];
const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG'];

const LABEL_MODELO = { BABY_LOOK: 'Baby Look', NORMAL: 'Normal' };

const LABEL_FUNCAO = {
    PARTICIPANTE: 'Participante',
    MEMBRO: 'Membro',
    DIRETOR_SITE: 'Diretor(a) de Site',
    DIRETOR_CONTEUDO: 'Diretor(a) de Conteúdo',
    DIRETOR_PATROCINIO: 'Diretor(a) de Patrocínio',
    DIRETOR_APOIO: 'Diretor(a) de Apoio',
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
                <text className="letraTamanhoCamisetaInicio" x="100" y="140" textAnchor="middle">
                    {tamanho}
                </text>
            </svg>
            <span className="legendaCamisetaInicio">
                {LABEL_MODELO[modelo]} · Tamanho {tamanho}
            </span>
        </div>
    );
}

export default function Inicio() {
    const [perfil, setPerfil] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregar, setErroCarregar] = useState('');

    const [ra, setRa] = useState('');
    const [modelo, setModelo] = useState('BABY_LOOK');
    const [tamanho, setTamanho] = useState('M');

    const [salvando, setSalvando] = useState(false);
    const [erroSalvar, setErroSalvar] = useState('');
    const [sucesso, setSucesso] = useState(false);

    // Aplica os dados carregados (ou recém-salvos) como base do formulário.
    function aplicarPerfil(dados) {
        setPerfil(dados);
        setRa(dados.ra ?? '');
        setModelo(dados.camiseta?.modelo ?? 'BABY_LOOK');
        setTamanho(dados.camiseta?.tamanho ?? 'M');
    }

    useEffect(() => {
        let ativo = true;
        buscarPerfil()
            .then((dados) => { if (ativo && dados) aplicarPerfil(dados); })
            .catch(() => { if (ativo) setErroCarregar('Não foi possível carregar seu perfil. Tente recarregar a página.'); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    const baseRa = perfil?.ra ?? '';
    const baseModelo = perfil?.camiseta?.modelo ?? 'BABY_LOOK';
    const baseTamanho = perfil?.camiseta?.tamanho ?? 'M';
    const alterou = ra.trim() !== baseRa || modelo !== baseModelo || tamanho !== baseTamanho;

    async function salvar(e) {
        e.preventDefault();
        if (!alterou || salvando) return;
        setSalvando(true);
        setErroSalvar('');
        setSucesso(false);
        try {
            const atualizado = await atualizarPerfil({ ra, modelo, tamanho });
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
                <h1 className="nomeBoasVindasInicio">{primeiroNome}</h1>
                <p className="emailUsuarioInicio">{perfil.email}</p>
            </header>

            <div className="painelPerfilInicio">
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

                    <div className="grupoCamisetaInicio">
                        <span className="rotuloCampoFinancas">Tipo de camiseta</span>
                        <div className="opcoesModeloInicio">
                            {MODELOS.map((opcao) => (
                                <button
                                    key={opcao}
                                    type="button"
                                    className={`botaoModeloInicio ${modelo === opcao ? 'botaoModeloAtivoInicio' : ''}`}
                                    aria-pressed={modelo === opcao}
                                    onClick={() => setModelo(opcao)}
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
                                    className={`botaoTamanhoInicio ${tamanho === opcao ? 'botaoTamanhoAtivoInicio' : ''}`}
                                    aria-pressed={tamanho === opcao}
                                    onClick={() => setTamanho(opcao)}
                                >
                                    {opcao}
                                </button>
                            ))}
                        </div>
                    </div>

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

                <PreviaCamiseta modelo={modelo} tamanho={tamanho} />
            </div>
        </div>
    );
}
