import "./ComoSuaDoacaoAjuda.css";

import iconCoffee from "../../assets/iconCoffee.svg";

const itens = [
    {
        titulo: "Coffee Break",
        descricao: "Saco vazio não para em pé",
        icone: iconCoffee,
    },
    {
        titulo: "Palestras",
        descricao: "Com profissionais melhores que o GPT",
        icone: iconCoffee,
    },
    {
        titulo: "Kit Semac",
        descricao: "Leve um pouco da Semac para casa",
        icone: iconCoffee,
    },
    {
        titulo: "Minicursos",
        descricao: "Para aprender na prática",
        icone: iconCoffee,
    },
];

const ComoSuaDoacaoAjuda = () => {
    return (
        <div className="como-ajuda-wrapper">
            <p className="como-ajuda-label">Como sua doação ajuda</p>

            <div className="como-ajuda-grid">
                <p>Sua doação contriui para que a formação de nossos participantes seja ainda mais completa e diversa.</p>
            </div>
        </div>
    );
};

export default ComoSuaDoacaoAjuda;
