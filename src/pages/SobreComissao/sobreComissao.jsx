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
            { foto: placeholder, nome: 'Membro 1', cargo: 'Presidente' },
            { foto: placeholder, nome: 'Membro 2', cargo: 'Vice-Presidente' },
            { foto: placeholder, nome: 'Membro 3', cargo: 'Assessor' },
        ],
    },
    {
        id: 'conteudo',
        nome: 'Conteúdo',
        cor: 'var(--azulConteudo)',
        descricao: 'Comissão responsável por planejar a programação da SEMAC, desde os temas das palestras e minicursos até os demais eventos proporcionados durante a semana. Ao longo do ano, os membros do conteúdo buscam por pessoas qualificadas para as atividades, elaboram os convites e mantém contato até o dia de recebê-las.',
        highlight: {
            phrase: 'programação da SEMAC',
            delay: 400,
            color: 'var(--azulConteudo)',
        },
        membros: [
            { foto: placeholder, nome: 'Membro 1', cargo: 'Coordenador' },
            { foto: placeholder, nome: 'Membro 2', cargo: 'Membro' },
            { foto: placeholder, nome: 'Membro 3', cargo: 'Membro' },
            { foto: placeholder, nome: 'Membro 4', cargo: 'Membro' },
        ],
    },
    {
        id: 'apoio',
        nome: 'Apoio',
        cor: 'var(--AmareloAuxApoio)',
        descricao: 'A comissão de apoio é responsável por dar apoio na organização do evento, marcando a presença dos participantes e ajudando no Coffee Break.',
        membros: [
            { foto: placeholder, nome: 'Membro 1', cargo: 'Coordenador' },
            { foto: placeholder, nome: 'Membro 2', cargo: 'Membro' },
            { foto: placeholder, nome: 'Membro 3', cargo: 'Membro' },
            { foto: placeholder, nome: 'Membro 4', cargo: 'Membro' },
        ],
    },
    {
        id: 'marketing',
        nome: 'Marketing',
        cor: 'var(--rosaMarketing)',
        descricao: 'A comissão de marketing é responsável por divulgar o evento nas redes sociais e criar artes para a divulgação da Semac.',
        membros: [
            { foto: placeholder, nome: 'Membro 1', cargo: 'Coordenador' },
            { foto: placeholder, nome: 'Membro 2', cargo: 'Designer' },
            { foto: placeholder, nome: 'Membro 3', cargo: 'Designer' },
        ],
    },
    {
        id: 'desenvolvimento',
        nome: 'Desenvolvimento',
        cor: 'var(--rosaMarketing)',
        descricao: 'A comissão de desenvolvimento é responsável por desenvolver os sistemas para o evento, como o site que você está vendo agora.',
        membros: [
            { foto: placeholder, nome: 'Membro 1', cargo: 'Coordenador' },
            { foto: placeholder, nome: 'Membro 2', cargo: 'Desenvolvedor' },
            { foto: placeholder, nome: 'Membro 3', cargo: 'Desenvolvedor' },
            { foto: placeholder, nome: 'Membro 4', cargo: 'Desenvolvedor' },
            { foto: placeholder, nome: 'Membro 5', cargo: 'Desenvolvedor' },
        ],
    },
    {
        id: 'patrocinio',
        nome: 'Patrocínio',
        cor: '#94499E',
        descricao: 'A comissão de patrocínio é responsável por conseguir patrocinadores para o evento, garantindo recursos para a realização da Semac.',
        membros: [
            { foto: placeholder, nome: 'Membro 1', cargo: 'Coordenador' },
            { foto: placeholder, nome: 'Membro 2', cargo: 'Membro' },
            { foto: placeholder, nome: 'Membro 3', cargo: 'Membro' },
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
    const [offset, setOffset] = useState(0);
    const [animDir, setAnimDir] = useState(null);

    const total = comissoes.length;

    // visible[0] = topo, visible[1] = meio (ativo), visible[2] = baixo
    const visible = [0, 1, 2].map(i => comissoes[(offset + i) % total]);
    const ativa = visible[1];

    function girar(direcao) {
        setAnimDir(direcao);
        setOffset(prev =>
            direcao === 'baixo'
                ? (prev + 1) % total
                : (prev - 1 + total) % total
        );
    }

    function clicar(posicao) {
        if (posicao === 1) return;
        if (posicao === 0) girar('cima');
        if (posicao === 2) girar('baixo');
    }

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
                <div className="descricao-container">
                    {renderDescricao(ativa)}
                </div>
                <div className="lateral-container">
                    <div className="carrossel-wrapper">
                        <div
                            className={`botoes-comissoes-container${animDir ? ` rotating-${animDir}` : ''}`}
                            onAnimationEnd={() => setAnimDir(null)}
                        >
                            {visible.map((comissao, i) => (
                                <button
                                    key={comissao.id}
                                    className={i === 1 ? 'ativo' : 'inativo'}
                                    style={{ backgroundColor: comissao.cor, color: 'var(--Branco)' }}
                                    onClick={() => clicar(i)}
                                >
                                    {comissao.nome}
                                </button>
                            ))}
                        </div>
                    </div>
                    <AnimatedTooltip key={ativa.id} membros={ativa.membros} />
                </div>
            </div>
        </div>
        </>
    );
};

export default SobreComissao;
