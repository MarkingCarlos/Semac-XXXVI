import { useState, useEffect, useRef, useLayoutEffect } from 'preact/hooks';
import './ComoSuaDoacaoAjudaV2.css';

const META_TOTAL = 2500; // R$ 2.500 — meta de arrecadação desta edição
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function formatarReais(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

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
            className={`indicadorCarrosselDoacao ${i === ativo ? 'indicadorCarrosselDoacaoAtivo' : ''}`}
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

function NomesDoadores({ nomes }) {
  const [qtdVisiveis, setQtdVisiveis] = useState(nomes.length);
  const refWrapper = useRef(null);
  const refMedidor = useRef(null);

  useLayoutEffect(() => {
    const wrapper = refWrapper.current;
    const medidor = refMedidor.current;
    if (!wrapper || !medidor) return;

    const calcular = () => {
      const larguraDisponivel = wrapper.clientWidth;
      let n = nomes.length;
      while (n > 0) {
        medidor.textContent = nomes.slice(0, n).join(' · ');
        if (medidor.offsetWidth <= larguraDisponivel) break;
        n--;
      }
      setQtdVisiveis(n);
    };

    calcular();
    const ro = new ResizeObserver(calcular);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [nomes]);

  return (
    <div ref={refWrapper} className="metaDoacaoDoadoresNomesWrapper">
      <span
        ref={refMedidor}
        className="metaDoacaoDoadoresNomes"
        style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', pointerEvents: 'none', top: 0, left: 0 }}
        aria-hidden="true"
      />
      <span className="metaDoacaoDoadoresNomes">
        {nomes.slice(0, qtdVisiveis).join(' · ')}
      </span>
    </div>
  );
}

function MetaDoacao() {
  const [arrecadado, setArrecadado] = useState(0);
  const [doadores, setDoadores] = useState([]);
  const [largura, setLargura] = useState(0);
  const [visivel, setVisivel] = useState(false);
  const refTrilho = useRef(null);

  const porcentagem = Math.min(Math.round((arrecadado / META_TOTAL) * 100), 100);

  // Busca o resumo público (total + nomes deduplicados). Sem valores individuais.
  useEffect(() => {
    let ativo = true;
    fetch(`${API_URL}/api/doador/resumo-publico`)
      .then((resposta) => (resposta.ok ? resposta.json() : Promise.reject()))
      .then((resumo) => {
        if (!ativo) return;
        setArrecadado(Number(resumo.totalArrecadado) || 0);
        setDoadores(Array.isArray(resumo.doadores) ? resumo.doadores : []);
      })
      .catch(() => {}); // silencioso: barra permanece em 0% se a API falhar
    return () => {
      ativo = false;
    };
  }, []);

  // Revela a barra ao entrar na viewport
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (refTrilho.current) obs.observe(refTrilho.current);
    return () => obs.disconnect();
  }, []);

  // Anima a largura quando visível; reanima se a porcentagem chegar depois dos dados
  useEffect(() => {
    if (visivel) setLargura(porcentagem);
  }, [visivel, porcentagem]);

  return (
    <div className="metaDoacao">
      <span className="valorMeta">{formatarReais(META_TOTAL)}</span>
      <div className="metaDoacaoTrilho" ref={refTrilho}>
        <div className="metaDoacaoProgresso" style={{ width: `${largura}%` }} />
      </div>
      <div className="metaDoacaoRodape">
        {doadores.length > 0 && (
          <div className="metaDoacaoDoadores">
            <span className="metaDoacaoDoadoresLabel">Últimos doadores:</span>
            <NomesDoadores nomes={doadores} />
          </div>
        )}
        <span className="metaDoacaoPorcentagem">{porcentagem}%</span>
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

      <MetaDoacao />

      {/* Mobile: carrossel */}
      <CarrosselMobile />
    </div>
  );
}
