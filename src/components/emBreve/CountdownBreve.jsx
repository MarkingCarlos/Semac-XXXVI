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
    <div className={`blocoContagemBreve ${grande ? 'blocoContagemBreveGrande' : 'blocoContagemBrevePequeno'}`}>
      <span className={`numeroContagemBreve ${animado ? 'numeroContagemBreveFlip' : ''}`}>{num}</span>
      <div className="divisorContagemBreve" />
      <span className="rotuloContagemBreve">{label}</span>
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
    <div className={`contagemBreve ${grande ? 'contagemBreveGrande' : 'contagemBrevePequena'}`}>
      {unidades.map((unidade, i) => (
        <span key={unidade.label} style={{ display: 'contents' }}>
          <Unidade valor={unidade.valor} label={unidade.label} grande={grande} animado={unidade.animado} />
          {i < unidades.length - 1 && (
            <span className={`doisPontosContagemBreve ${grande ? 'doisPontosContagemBreveGrande' : ''}`}>:</span>
          )}
        </span>
      ))}
    </div>
  );
}
