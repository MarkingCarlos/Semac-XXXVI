import { useState } from "react";
import "./sobreComissao.css";
import fotoGuilherme from '/src/assets/fotosPessoas/guilherme-foto.png';
import SplitText from '../../components/cronogramaFiltro/SplitText';
import AnimatedTooltip from '../../components/AnimatedTooltip/AnimatedTooltip';

const placeholder = fotoGuilherme;

// Ordem circular: clicar no botão de baixo avança para o próximo na lista
const comissoes = [
    {
        id: 'presidencia',
        nome: 'Presidência',
        cor: 'var(--vermelhoDiretoria)', // trocar pela cor real
        descricao: 'A comissão de presidência é responsável por coordenar todas as outras comissões e garantir que o evento ocorra da melhor forma possível.',
        membros: [
            { foto: placeholder, nome: 'Carlos Alberto', cargo: 'Diretor' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
        ],
    },
    {
        id: 'conteudo',
        nome: 'Conteúdo',
        cor: 'var(--azulConteudo)', // trocar pela cor real
        descricao: 'A comissão de conteúdo é responsável por criar conteúdos para o evento, além de entrar em contato com possíveis palestrantes para realizar o convite para palestrar na Semac.',
        membros: [
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
        ],
    },
    {
        id: 'apoio',
        nome: 'Apoio',
        cor: 'var(--AmareloAuxApoio)', // trocar pela cor real
        descricao: 'A comissão de apoio é responsável por dar apoio na organização do evento, marcando a presença dos participantes e ajudando no Coffee Break.',
        membros: [
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
        ],
    },
    {
        id: 'marketing',
        nome: 'Marketing',
        cor: 'var(--rosaMarketing)', // trocar pela cor real
        descricao: 'A comissão de marketing é responsável por divulgar o evento nas redes sociais e criar artes para a divulgação da Semac.',
        membros: [
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
        ],
    },
    {
        id: 'desenvolvimento',
        nome: 'Desenvolvimento',
        cor: 'var(--rosaMarketing)', // trocar pela cor real
        descricao: 'A comissão de desenvolvimento é responsável por desenvolver os sistemas para o evento, como o site que você está vendo agora.',
        membros: [
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
        ],
    },
    {
        id: 'patrocinio',
        nome: 'Patrocínio',
        cor: '#94499E', // trocar pela cor real
        descricao: 'A comissão de patrocínio é responsável por conseguir patrocinadores para o evento, garantindo recursos para a realização da Semac.',
        membros: [
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
            { foto: placeholder, nome: 'placeholder', cargo: 'placeholder' },
        ],
    },
];

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
        if (posicao === 1) return;          // já está no meio, ignora
        if (posicao === 0) girar('cima');   // clicou no topo → topo vira meio, novo item entra pelo topo
        if (posicao === 2) girar('baixo');  // clicou embaixo → baixo vira meio, novo item entra pelo baixo
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
                    <p>{ativa.descricao}</p>
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
