import { useState, useEffect } from 'react';
import { DATA_ANUNCIO } from './tokens.js';
import './countdownBreve.css';

/**
 * useContagem — hook que recalcula dias/horas/min/seg a cada segundo
 * até a data-alvo definida em tokens.js.
 */
function useContagem() {
  const [restante, setRestante] = useState(() => DATA_ANUNCIO.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRestante(DATA_ANUNCIO.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const total = Math.max(0, restante);
  return {
    d: Math.floor(total / 86400000),
    h: Math.floor((total % 86400000) / 3600000),
    m: Math.floor((total % 3600000)  / 60000),
    s: Math.floor((total % 60000)    / 1000),
  };
}

function Unidade({ valor, label, grande, animado }) {
  const num = String(valor).padStart(2, '0');
  return (
    <div className={`contagem-bloco ${grande ? 'contagem-bloco--grande' : 'contagem-bloco--pequeno'}`}>
      <span className={`contagem-numero ${animado ? 'contagem-numero--flip' : ''}`}>{num}</span>
      <div className="contagem-divisor" />
      <span className="contagem-rotulo">{label}</span>
    </div>
  );
}

/**
 * CountdownBreve — contador regressivo até o anúncio oficial dos palestrantes.
 *
 * @param {('lg'|'sm')} tamanho — 'lg' para desktop, 'sm' para mobile
 */
export default function CountdownBreve({ tamanho = 'lg' }) {
  const { d, h, m, s } = useContagem();
  const grande = tamanho === 'lg';

  const unidades = [
    { valor: d, label: 'DIAS'  },
    { valor: h, label: 'HORAS' },
    { valor: m, label: 'MINUTOS'   },
    { valor: s, label: 'SEGUNDOS',  animado: true },
  ];

  return (
    <div className={`contagem ${grande ? 'contagem--grande' : 'contagem--pequena'}`}>
      {unidades.map((u, i) => (
        <span key={u.label} style={{ display: 'contents' }}>
          <Unidade valor={u.valor} label={u.label} grande={grande} animado={u.animado} />
          {i < unidades.length - 1 && (
            <span className={`contagem-dois-pontos ${grande ? 'contagem-dois-pontos--grande' : ''}`}>:</span>
          )}
        </span>
      ))}
    </div>
  );
}
