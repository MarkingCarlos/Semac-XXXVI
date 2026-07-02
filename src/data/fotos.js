import ana from '../assets/fotosPessoas/ana.png';
import Arthur from '../assets/fotosPessoas/Arthur.png';
import Beatriz from '../assets/fotosPessoas/Beatriz.png'; // adicionar .png ao arquivo
import Berti from '../assets/fotosPessoas/Berti.png';
import Carlos from '../assets/fotosPessoas/Carlos.png'; // adicionar .png ao arquivo
import casanova from '../assets/fotosPessoas/casanova.png';
import Daniel from '../assets/fotosPessoas/Daniel.png';
import Enrico from '../assets/fotosPessoas/Enrico.png';
import Freitas from '../assets/fotosPessoas/Freitas.png';
import Galocha from '../assets/fotosPessoas/Galocha.png'; // adicionar .png ao arquivo
import Gomes from '../assets/fotosPessoas/Gomes.png'; // adicionar .png ao arquivo
import guilherme_foto from '../assets/fotosPessoas/guilherme-foto.png';
import Guta from '../assets/fotosPessoas/Guta.png';
import Heitor from '../assets/fotosPessoas/Heitor.png'; // adicionar .png ao arquivo
import Helena from '../assets/fotosPessoas/Helena.png';
import hugo from '../assets/fotosPessoas/hugo.png';
import Joao_victor from '../assets/fotosPessoas/Joao_victor.png'; // adicionar .png ao arquivo
import luis from '../assets/fotosPessoas/luis.png';
import MARI from '../assets/fotosPessoas/MARI.PNG';
import Maria_Clara from '../assets/fotosPessoas/Maria_Clara.png'; // adicionar .png ao arquivo
import Maria_Rodrigues from '../assets/fotosPessoas/Maria_Rodrigues.png';
import MATEUS from '../assets/fotosPessoas/MATEUS.PNG';
import Midori from '../assets/fotosPessoas/Midori.png';
import Miguel from '../assets/fotosPessoas/Miguel.png';
import mirian from '../assets/fotosPessoas/mirian.png';
import Paulo from '../assets/fotosPessoas/Paulo.png'; // adicionar .png ao arquivo
import possari from '../assets/fotosPessoas/possari.png';
import ravi from '../assets/fotosPessoas/ravi.png';
import Ricardo from '../assets/fotosPessoas/Ricardo.png';
import richard from '../assets/fotosPessoas/richard.png';
import Rodrigo from '../assets/fotosPessoas/Rodrigo.png';
import fotoSuper from '../assets/fotosPessoas/super.png'; // "super" é palavra reservada
import takeshi from '../assets/fotosPessoas/takeshi.png';
import Vincent from '../assets/fotosPessoas/Vincent.png'; // adicionar .png ao arquivo
import Vitor from '../assets/fotosPessoas/Vitor.png';
import Vitoria from '../assets/fotosPessoas/Vitoria.png';
import wally from '../assets/fotosPessoas/wally.png';
import dantas from '../assets/fotosPessoas/dantas.png';
import adriana from '../assets/fotosPessoas/adriana.jpeg';

export {
    ana,
    Arthur,
    Beatriz,
    Berti,
    Carlos,
    casanova,
    Daniel,
    Enrico,
    Freitas,
    Galocha,
    Gomes,
    guilherme_foto,
    Guta,
    Heitor,
    Helena,
    hugo,
    Joao_victor,
    luis,
    MARI,
    Maria_Clara,
    Maria_Rodrigues,
    MATEUS,
    Midori,
    Miguel,
    mirian,
    Paulo,
    possari,
    ravi,
    Ricardo,
    richard,
    Rodrigo,
    fotoSuper,
    takeshi,
    Vincent,
    Vitor,
    Vitoria,
    wally,
    dantas,
    adriana
};

export const comissoes = [
    {
        id: 'presidencia',
        nome: 'Presidência',
        cor: 'var(--vermelhoDiretoria)',
        descricao: 'A presidência consiste de pessoas responsáveis pela gestão geral da SEMAC, garantindo que todas as ' +
            'comissões trabalhem de forma integrada e alinhada aos objetivos do evento. Cabe a essa equipe tomar as ' +
            'decisões estratégicas, acompanhar o andamento das atividades, assegurar a comunicação eficiente entre as ' +
            'comissões e representar o evento institucionalmente, atuando como elo central para que o planejamento seja ' +
            'cumprido com organização e qualidade dentro dos prazos estabelecidos.',
        highlight: {
            phrase: "garantindo que todas as comissões trabalhem de forma integrada e alinhada aos objetivos do evento.",
            delay: 400,
            color: 'var(--vermelhoDiretoria)',
        },
        membros: [
            { foto: Maria_Clara, nome: 'Maria Clara', cargo: 'Presidente' },
            { foto: adriana, nome: 'Profa. Dra. Adriana Barbosa', cargo: 'Coordenadora' },
            { foto: Vitoria, nome: 'Vitória Reis', cargo: 'Vice-Presidente' },
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
            { foto: ana, nome: 'Ana Clara', cargo: 'Diretora' },
            { foto: MARI, nome: 'Mariana Rosset', cargo: 'Membro' },
            { foto: Guta, nome: 'Maria Augusta', cargo: 'Membro' },
            { foto: MATEUS, nome: 'Mateus Tavares', cargo: 'Membro' },
            { foto: Galocha, nome: 'Galocha', cargo: 'Membro' },
            { foto: casanova, nome: 'Júlio Telles Casanova', cargo: 'Membro' },
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
            { foto: Enrico, nome: 'Enrico Gorzelak', cargo: 'Diretor' },
            { foto: fotoSuper, nome: 'João Rampim', cargo: 'Membro' },
            { foto: Paulo, nome: 'Paulo Sérgio', cargo: 'Membro' },
            { foto: Vincent, nome: 'Vincent Frias', cargo: 'Membro' },
            { foto: mirian, nome: 'Mirian Jaeger', cargo: 'Membro' },
            { foto: Freitas, nome: 'Matheus Freitas', cargo: 'Membro' },
            { foto: Gomes, nome: 'Matheus Gomes', cargo: 'Membro' },
            { foto: Rodrigo, nome: 'Rodrigo Souza', cargo: 'Membro' },
        ],
    },
    {
        id: 'marketing',
        nome: 'Marketing',
        cor: 'var(--rosaMarketing)',
        descricao: 'A comissão é responsável por toda a identidade visual da SEMAC, desde de paleta de cores até' +
            ' as cartas que serão enviadas para os patrocinadores e apoiadores, além de produz conteúdos para redes ' +
            'sociais, como posts, stories e artes informativas, ajudando na divulgação e no engajamento do público.',
        highlight: {
            phrase: "ajudando na divulgação e no engajamento do público.",
            delay: 400,
            color: 'var(--rosaMarketing)',
        },
        membros: [
            { foto: Miguel, nome: 'Miguel Augusto', cargo: 'Diretor' },
            { foto: Joao_victor, nome: 'Vitor Vitor', cargo: 'Membro' },
            { foto: Vitor, nome: 'Vítor Henrique', cargo: 'Membro' },
            { foto: Beatriz, nome: 'Beatriz', cargo: 'Membro' },
            { foto: Helena, nome: 'Helena', cargo: 'Membro' },
            { foto: Heitor, nome: 'Heitor Rogério', cargo: 'Membro' },
        ],
    },
    {
        id: 'desenvolvimento',
        nome: 'Desenvolvimento',
        cor: 'var(--rosaMarketing)',
        descricao: 'Comissão responsável pelo desenvolvimento e manutenção do site da SEMAC, uma plataforma interativa ' +
            'na qual os participantes podem acompanhar o evento e vivenciar a experiência de forma dinâmica e engajante.' +
            ' Também é responsabilidade da equipe assegurar o bom funcionamento do site durante todo o período do evento,' +
            ' trabalhando em conjunto com as demais comissões para atender às necessidades tecnológicas de cada uma.',
        highlight: {
            phrase: "uma plataforma interativa na qual os participantes podem acompanhar o evento e vivenciar a experiência de forma dinâmica e engajante.",
            delay: 400,
            color: 'var(--rosaMarketing)',
        },
        membros: [
            { foto: Carlos, nome: 'Carlos Alberto', cargo: 'Diretor' },
            { foto: Maria_Rodrigues, nome: 'Maria Rodrigues', cargo: 'Membro' },
            { foto: guilherme_foto, nome: 'Guilherme Soares', cargo: 'Membro' },
            { foto: ravi, nome: 'Ravi Bellini', cargo: 'Membro' },
            { foto: Arthur, nome: 'Arthur Rezende', cargo: 'Membro' },
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
        highlight: {
            phrase: 'fiscalização constante das finanças da SEMAC',
            delay: 400,
            color: '#94499E',
        },
        membros: [
            { foto: takeshi, nome: 'Leonardo Takeshi', cargo: 'Diretor' },
            { foto: hugo, nome: 'Hugo Tartari', cargo: 'Membro' },
            { foto: Ricardo, nome: 'Ricardo Martins', cargo: 'Membro' },
            { foto: Midori, nome: 'Clarisse Torres', cargo: 'Membro' },
            { foto: dantas, nome: 'João Dantas', cargo: 'Membro' },
            { foto: wally, nome: 'Walysson C. B. de Carvalho', cargo: 'Membro' },
            { foto: luis, nome: 'Luís Passoni', cargo: 'Membro' },
        ],
    },
];
