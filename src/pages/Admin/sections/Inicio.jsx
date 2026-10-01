// Seção "Início" do /admin — a primeira que o membro da comissão vê.
// Dá as boas-vindas pelo nome, mostra a dashboard do evento e deixa manter
// o RA em dia. As camisetas já foram encomendadas, então não aparecem
// nem são editáveis aqui; e-mail e função são apenas exibidos.
//
// Dados vêm de GET /api/pessoa/me e o RA é salvo em PATCH /api/pessoa/me
// (o usuário é identificado pelo token — ver data/apiPerfil.js).

import { useState, useEffect } from 'preact/hooks';
import { Link } from 'wouter';
import { buscarPerfil, atualizarPerfil } from '../data/apiPerfil.js';
import { temAcessoDashboard } from '../../../auth/sessao.js';
import DashboardAdmin from '../../../components/dashboardAdmin/DashboardAdmin.jsx';
import './inicio.css';

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

export default function Inicio({ podeAcessarFinanceiro = false, podeVerPrevisao = false, podeGerenciarDoacoes = false }) {
    const [perfil, setPerfil] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregar, setErroCarregar] = useState('');

    const [ra, setRa] = useState('');

    const [salvando, setSalvando] = useState(false);
    const [erroSalvar, setErroSalvar] = useState('');
    const [sucesso, setSucesso] = useState(false);

    // Aplica os dados carregados (ou recém-salvos) como base do formulário.
    function aplicarPerfil(dados) {
        setPerfil(dados);
        setRa(dados.ra ?? '');
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
    const alterou = ra.trim() !== baseRa;

    async function salvar(e) {
        e.preventDefault();
        if (!alterou || salvando) return;
        setSalvando(true);
        setErroSalvar('');
        setSucesso(false);
        try {
            const atualizado = await atualizarPerfil({ ra });
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
                    {podeAcessarFinanceiro ? (
                        <Link href="/financeiro" className="cartaoIrFinanceiroInicio">
                            <span className="tituloCartaoIrFinanceiroInicio">Ir para o financeiro</span>
                            <span className="subtituloCartaoIrFinanceiroInicio">Acessar o painel financeiro da SEMAC</span>
                        </Link>
                    ) : podeGerenciarDoacoes ? (
                        /* Diretor de patrocínio: além da Previsão (leitura),
                           gerencia as Doações, que moram no /financeiro. */
                        <Link href="/financeiro" className="cartaoIrFinanceiroInicio">
                            <span className="tituloCartaoIrFinanceiroInicio">Previsão e doações</span>
                            <span className="subtituloCartaoIrFinanceiroInicio">Acompanhar o orçamento e cadastrar doações</span>
                        </Link>
                    ) : podeVerPrevisao && (
                        <Link href="/financeiro" className="cartaoIrFinanceiroInicio">
                            <span className="tituloCartaoIrFinanceiroInicio">Ver previsão de gastos</span>
                            <span className="subtituloCartaoIrFinanceiroInicio">Acompanhar o orçamento da SEMAC (somente leitura)</span>
                        </Link>
                    )}
                </div>

            </header>

            {temAcessoDashboard() && <DashboardAdmin />}

            <form className="formularioPerfilInicio" onSubmit={salvar}>
                <p className="divisorFormularioFinancas">Seus dados</p>

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
