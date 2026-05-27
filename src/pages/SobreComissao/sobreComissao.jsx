import { useState } from "react";
import "./sobreComissao.css";
import fotoGuilherme from '/src/assets/fotosPessoas/guilherme-foto.png';
import SplitText from '../../components/cronogramaFiltro/SplitText';
import TextHighlight from '../../components/TextHighlight/TextHighlight.jsx';
import AnimatedTooltip from '../../components/AnimatedTooltip/AnimatedTooltip';

const placeholder = fotoGuilherme;

const comissoes = [
    {
        id: 'presidencia',
        nome: 'Presidência',
        cor: 'var(--vermelhoDiretoria)',
        descricao: 'A comissão de presidência é responsável por coordenar todas as outras comissões e garantir que o evento ocorra da melhor forma possível.',
        membros: [
            { foto: placeholder, nome: 'Maria Clara', cargo: 'Presidente' },
            { foto: placeholder, nome: 'Vitória Reis', cargo: 'Vice-Presidente' },
            { foto: placeholder, nome: 'Profa. Dra. Adriana Barbosa', cargo: 'Coordenadora' },
        ],
    },
    {
        id: 'conteudo',
        nome: 'Conteúdo',
        cor: 'var(--azulConteudo)',
        descricao: 'Comissão responsável por planejar a programação da SEMAC, desde os temas das palestras e minicursos ' +
            'até os demais eventos proporcionados durante a semana. Ao longo do ano, os membros do conteúdo buscam por ' +
            'pessoas qualificadas para as atividades, elaboram os convites e mantém contato até o dia de recebê-las.',
        highlight: {
            phrase: 'programação da SEMAC',
            delay: 400,
            color: 'var(--azulConteudo)',
        },
        membros: [
            { foto: placeholder, nome: 'Ana Clara', cargo: 'Diretora' },
            { foto: placeholder, nome: 'Daniel Tozzo', cargo: 'Membro' },
            { foto: placeholder, nome: 'Mariana Rosset', cargo: 'Membro' },
            { foto: placeholder, nome: 'Maria Augusta', cargo: 'Membro' },
        ],
    },
    {
        id: 'apoio',
        nome: 'Apoio',
        cor: 'var(--AmareloAuxApoio)',
        descricao: 'A Comissão de apoio une esforços durante o ano para tornar o evento possível, pesquisando ' +
            'orçamentos para a confecção dos produtos e para o fornecimento do coffee break na semana. Dentre as ' +
            'atividades feitas está a preparação dos kits e escolha dos brindes sorteados no evento. Durante a semana, essa comissão também é responsável por dar suporte às atividades realizadas.',
        highlight: {
            phrase: 'tornar o evento possível',
            delay: 400,
            color: 'var(--AmareloAuxApoio)',
        },
        membros: [
            { foto: placeholder, nome: 'Enrico Gorzelak', cargo: 'Diretor' },
            { foto: placeholder, nome: 'João Rampim', cargo: 'Membro' },
            { foto: placeholder, nome: 'Paulo Sérgio', cargo: 'Membro' },
            { foto: placeholder, nome: 'Vincent Frias', cargo: 'Membro' },
        ],
    },
    {
        id: 'marketing',
        nome: 'Marketing',
        cor: 'var(--rosaMarketing)',
        descricao: 'A comissão é responsável por toda a identidade visual da SEMAC, desde de paleta de cores até' +
            ' as cartas que serão enviadas para os patrocinadores e apoiadores, além de produz conteúdos para redes ' +
            'sociais, como posts, stories e artes informativas, ajudando na divulgação e no engajamento do público.',
        membros: [
            { foto: placeholder, nome: 'Miguel Augusto', cargo: 'Diretor' },
            { foto: placeholder, nome: 'Vitor Vitor', cargo: 'Designer' },
            { foto: placeholder, nome: 'Vítor Henrique', cargo: 'Designer' },
        ],
    },
    {
        id: 'desenvolvimento',
        nome: 'Desenvolvimento',
        cor: 'var(--rosaMarketing)',
        descricao: 'A comissão de desenvolvimento é responsável por desenvolver os sistemas para o evento, como o site que você está vendo agora.',
        membros: [
            { foto: placeholder, nome: 'Carlos Alberto', cargo: 'Diretor' },
            { foto: placeholder, nome: 'Maria Rodrigues', cargo: 'Desenvolvedor' },
            { foto: placeholder, nome: 'Guilherme Soares', cargo: 'Desenvolvedor' },
            { foto: placeholder, nome: 'Ravi Bellini', cargo: 'Desenvolvedor' },
            { foto: placeholder, nome: 'Arthur Rezende', cargo: 'Desenvolvedor' },
        ],
    },
    {
        id: 'patrocinio',
        nome: 'Patrocínio',
        cor: '#94499E',
        descricao: 'Comissão responsável pela elaboração das cotas de patrocínio da SEMAC e por entrar em contato com' +
            ' as empresas, apresentando as cotas e pedindo o apoio das mesmas para o evento. Também é responsabilidade ' +
            'do patrocínio manter uma fiscalização constante das finanças da SEMAC, trabalhando em conjunto com as demais ' +
            'comissões para realizar os orçamentos das atividades de cada uma.',
        membros: [
            { foto: placeholder, nome: 'Leonardo Takeshi', cargo: 'Diretor' },
            { foto: placeholder, nome: 'Hugo Tartari', cargo: 'Membro' },
            { foto: placeholder, nome: 'Ricardo Martins', cargo: 'Membro' },
        ],
    },
];

function renderDescricao(comissao) {
    const { descricao, highlight, id } = comissao;
    if (!highlight) return <p>{descricao}</p>;

    const idx = descricao.indexOf(highlight.phrase);
    const before = descricao.slice(0, idx);
    const after = descricao.slice(idx + highlight.phrase.length);

    return (
        <p>
            {before}
            <TextHighlight
                key={id}
                text={highlight.phrase}
                delay={highlight.delay}
                color={highlight.color}
            />
            {after}
        </p>
    );
}

const SobreComissao = () => {
    const [ativaIdx, setAtivaIdx] = useState(0);
    const ativa = comissoes[ativaIdx];

    return (
        <>
        <div className="container">
            <h1>
                <SplitText
                    key={ativa.id}
                    tag="span"
                    text={ativa.nome}
                    textAlign="start"
                    delay={40}
                    duration={0.5}
                    ease="power3.out"
                    from={{ opacity: 0, y: 30 }}
                    to={{ opacity: 1, y: 0 }}
                    threshold={0}
                    rootMargin="0px"
                />
            </h1>
            <div className="conteudo-container">
                <div key={ativa.id} className="descricao-container">
                    {renderDescricao(ativa)}
                </div>
                <div className="lateral-container">
                    <div className="botoes-comissoes-container">
                        {comissoes.map((comissao, i) => (
                            <button
                                key={comissao.id}
                                className={i === ativaIdx ? 'ativo' : 'inativo'}
                                style={{ backgroundColor: comissao.cor, color: 'var(--Branco)' }}
                                onClick={() => setAtivaIdx(i)}
                            >
                                {comissao.nome}
                            </button>
                        ))}
                    </div>
                    <AnimatedTooltip key={ativa.id} membros={ativa.membros} />
                </div>
            </div>
        </div>
        </>
    );
};

export default SobreComissao;
