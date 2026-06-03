import { useState, useEffect, useRef } from 'preact/hooks';
import './ComoSuaDoacaoAjudaV2.css';

const ITENS = [
  {
    titulo: 'Democratização da Ciência',
    descricao: 'Divulgação Científica para todos',
  },
  {
    titulo: 'Palestras e Minicursos',
    descricao: 'Formação de profissionais capacitados',
  },
  {
    titulo: 'Mostra Técnica',
    descricao: 'Momento de integração com a comunidade',
  },
  {
    titulo: 'Gamificação',
    descricao: 'Criatividade e Lógica em jogo',
  },
];

function CardDoacao({ titulo, descricao }) {
  return (
    <div className="cardDoacao">
      <span className="cardAccent" aria-hidden="true" />
      <div className="cardConteudo">
        <div className="cardTitulo">{titulo}</div>
        <div className="cardDescricao">{descricao}</div>
      </div>
    </div>
  );
}

function CarrosselMobile() {
  const [ativo, setAtivo] = useState(0);
  const [visivel, setVisivel] = useState(true);
  const timeoutRef = useRef(null);

  const irPara = (index) => {
    setVisivel(false);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAtivo(index);
      setVisivel(true);
    }, 350);
  };

  useEffect(() => {
    const intervalo = setInterval(() => {
      irPara((ativo + 1) % ITENS.length);
    }, 5000);
    return () => {
      clearInterval(intervalo);
      clearTimeout(timeoutRef.current);
    };
  }, [ativo]);

  return (
    <div className="carrosselMobile">
      <div className={`carrosselJanela ${visivel ? 'carrosselVisivel' : 'carrosselSaindo'}`}>
        <CardDoacao {...ITENS[ativo]} />
      </div>
      <div className="carrosselIndicadores" role="tablist" aria-label="Navegação do carrossel">
        {ITENS.map((item, i) => (
          <button
            key={item.titulo}
            className={`indicador ${i === ativo ? 'indicadorAtivo' : ''}`}
            onClick={() => irPara(i)}
            role="tab"
            aria-selected={i === ativo}
            aria-label={item.titulo}
          />
        ))}
      </div>
    </div>
  );
}

export default function ComoSuaDoacaoAjudaV2() {
  return (
    <div className="doacaoAjudaV2">
      <p className="doacaoAjudaTitulo">Como sua doação ajuda</p>

      {/* Desktop: grade 2×2 */}
      <div className="gradeDesktop">
        {ITENS.map(item => (
          <CardDoacao key={item.titulo} {...item} />
        ))}
      </div>

      {/* Mobile: carrossel */}
      <CarrosselMobile />
    </div>
  );
}
