import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?';

const EncryptedText = ({
  text,
  className = '',
  revealDelayMs = 50,
  flipDelayMs = 50,
  loopDelayMs = 8000,
  charset = DEFAULT_CHARSET,
  encryptedClass = '',
  revealedClass = '',
}) => {
  const [displayChars, setDisplayChars] = useState(() =>
    text.split('').map((c) =>
      c === ' ' ? ' ' : charset[Math.floor(Math.random() * charset.length)]
    )
  );
  const [revealedCount, setRevealedCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);
  const containerRef = useRef(null);
  const revealedCountRef = useRef(0);

  useEffect(() => {
    revealedCountRef.current = revealedCount;
  }, [revealedCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Reset para o início de cada ciclo
    revealedCountRef.current = 0;
    setRevealedCount(0);
    setDisplayChars(
      text.split('').map((c) =>
        c === ' ' ? ' ' : charset[Math.floor(Math.random() * charset.length)]
      )
    );

    const flipInterval = setInterval(() => {
      const current = revealedCountRef.current;
      if (current >= text.length) {
        clearInterval(flipInterval);
        setDisplayChars(text.split(''));
        return;
      }
      setDisplayChars(
        text.split('').map((char, i) => {
          if (i < current) return char;
          if (char === ' ') return ' ';
          return charset[Math.floor(Math.random() * charset.length)];
        })
      );
    }, flipDelayMs);

    const revealInterval = setInterval(() => {
      setRevealedCount((prev) => {
        const next = prev + 1;
        revealedCountRef.current = next;
        if (next >= text.length) clearInterval(revealInterval);
        return next;
      });
    }, revealDelayMs);

    // Após o reveal completo + loopDelayMs, inicia novo ciclo
    const loopTimer = setTimeout(() => {
      setCycleKey((k) => k + 1);
    }, text.length * revealDelayMs + loopDelayMs);

    return () => {
      clearInterval(flipInterval);
      clearInterval(revealInterval);
      clearTimeout(loopTimer);
    };
  }, [isVisible, cycleKey, text, charset, revealDelayMs, flipDelayMs, loopDelayMs]);

  return (
    <span ref={containerRef} className={className}>
      {displayChars.map((char, i) => (
        <span key={i} className={i < revealedCount ? revealedClass : encryptedClass}>
          {char}
        </span>
      ))}
    </span>
  );
};

export default EncryptedText;
