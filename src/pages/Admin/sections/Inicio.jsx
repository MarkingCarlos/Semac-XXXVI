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
import { listarSorteios } from '../../Sorteio/data/apiSorteio.js';
import { temAcessoDashboard, temAcessoDashboardMinicursos, temAcessoDashboardRanking } from '../../../auth/sessao.js';
import DashboardAdmin, { DashboardParcialAdmin } from '../../../components/dashboardAdmin/DashboardAdmin.jsx';
import CardBrindeComissaoInicio from './CardBrindeComissaoInicio.jsx';
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

/* Data local em 'YYYY-MM-DD' — mesmo critério da /sorteio para "hoje". */
function hojeIsoInicio() {
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${agora.getFullYear()}-${mes}-${dia}`;
}

export default function Inicio({ podeAcessarFinanceiro = false, podeVerPrevisao = false, podeGerenciarDoacoes = false }) {
    const [perfil, setPerfil] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erroCarregar, setErroCarregar] = useState('');

    const [ra, setRa] = useState('');

    const [salvando, setSalvando] = useState(false);
    const [erroSalvar, setErroSalvar] = useState('');
    const [sucesso, setSucesso] = useState(false);

    /* Sorteios de hoje, para o card de atalho dizer o que tem para sortear.
       null = ainda carregando ou falhou; o card funciona do mesmo jeito. */
    const [sorteiosHoje, setSorteiosHoje] = useState(null);

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

    useEffect(() => {
        let ativo = true;
        const hoje = hojeIsoInicio();
        listarSorteios()
            .then((lista) => {
                if (!ativo) return;
                setSorteiosHoje(lista.filter((sorteio) => (sorteio.eventoDataHoraInicio || '').slice(0, 10) === hoje));
            })
            .catch(() => {});
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

    /* Ainda pendentes = sem ganhador registrado. */
    const pendentesHoje = sorteiosHoje?.filter((sorteio) => sorteio.quantidadeEntregue === 0) ?? [];
    const subtituloCardIrSorteio = sorteiosHoje === null
        ? 'Tela de sorteio dos brindes'
        : pendentesHoje.length === 0
            ? 'Nada para sortear hoje'
            : `${pendentesHoje.length} ${pendentesHoje.length === 1 ? 'sorteio pendente' : 'sorteios pendentes'} hoje`;
    const textoSorteiosHoje = sorteiosHoje === null
        ? 'Escolha o sorteio, gire e registre quem ganhou.'
        : pendentesHoje.length > 0
            ? pendentesHoje.map((sorteio) => sorteio.nome).join(', ')
            : sorteiosHoje.length > 0
                ? 'Todos os sorteios de hoje já têm ganhador.'
                : 'Os sorteios são cadastrados no evento, em Conteúdo.';

    return (
        <div className="conteudoInicio">

            <header className="cabecalhoBoasVindasInicio">
                 <span className="eyebrowPerfilInicio">
                   Perfil<span className="separadorEyebrowInicio">/</span>{funcao}
                 </span>
                <div className="adminRow">
                    <div className="boasbindasAdmin" >
                        <p className="saudacaoInicio">Bem-vindo,</p>
                        <h1 className="nomeBoasVindasInicio">{primeiroNome}</h1>
                    </div>

                    <div className="linhaNomeCardInicio">
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
                </div>
        </header>


            {temAcessoDashboard()
                ? <DashboardAdmin />
                : (
                    <DashboardParcialAdmin
                        mostrarMinicursos={temAcessoDashboardMinicursos()}
                        mostrarRanking={temAcessoDashboardRanking()}
                    />
                )}

            {/* Atalho para a /sorteio, no visual dos cards da dashboard e logo
                abaixo do carrossel. Fica fora da DashboardAdmin de propósito:
                a dashboard é só da presidência e da diretoria de site, mas
                toda a comissão realiza sorteios. */}
            <div className="gradeCardIrSorteioInicio">
                <Link href="/sorteio" className="cardDashboard cardIrSorteioInicio">
                    <span className="tituloCardDashboard">Realizar sorteio</span>
                    <span className="subtituloCardDashboard">{subtituloCardIrSorteio}</span>
                    <span className="conteudoCardDashboard">
                        <span className="textoSorteiosHojeInicio">{textoSorteiosHoje}</span>
                    </span>
                </Link>
                {/* Só no dia do brinde da comissão; fora dele não renderiza nada. */}
                <CardBrindeComissaoInicio />
            </div>

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
