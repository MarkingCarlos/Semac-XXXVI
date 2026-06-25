import logoSemac from '/src/assets/logotipo.svg';
import './footerNovo.css';
import paperTexture from '/src/assets/PAPER.png'

// ── Ícones ─────────────────────────────────────────────────────────

function IconeInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function IconeLinkedIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

function IconeYouTube() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
    </svg>
  );
}

function IconeEmailRede() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function IconeLocalizacao() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconeEmailContato() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-10 5L2 7"/>
    </svg>
  );
}

// ── Blocos de conteúdo ─────────────────────────────────────────────

function FooterOnda() {
  return (
    <div className="onda">
      <svg viewBox="0 0 2962 175" preserveAspectRatio="none" className="ondaSvg">
        <path fill="currentColor" d="M 0 175 L 0 80 C 300 20 620 0 980 40 C 1320 78 1640 150 1980 120 C 2300 92 2620 20 2962 60 L 2962 175 Z"/>
      </svg>
    </div>
  );
}

function FooterLogo() {
  return (
    <div className="logo">
      <img src={logoSemac} alt="SEMAC" className="logoImagem" />
      <div>
        <div className="logoNome">SEMAC</div>
        <div className="logoTagline">XXXVI Semana da Computação · IBILCE/UNESP</div>
      </div>
    </div>
  );
}

function abrirEmail(evento) {
  const ehDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (ehDesktop) {
    evento.preventDefault();
    window.open('https://mail.google.com/mail/?view=cm&fs=1&to=apoio@semac.cc', '_blank', 'noopener,noreferrer');
  }
}

function FooterRedes() {
  return (
    <div className="redes">
      <a href="https://www.instagram.com/semacsjrp/" target="_blank" rel="noopener noreferrer" className="botaoRede" title="Instagram">
        <IconeInstagram />
      </a>
      <a href="https://www.linkedin.com/company/semacsjrp/?viewAsMember=true" target={"_blank"}
         className="botaoRede" title="LinkedIn">
        <IconeLinkedIn />
      </a>
      <a href="https://www.youtube.com/@SEMACsjrp" target={"_blank"} className="botaoRede" title="YouTube">
        <IconeYouTube />
      </a>
      <a href="mailto:apoio@semac.cc" target={"_blank"} onClick={abrirEmail} className="botaoRede" title="E-mail">
        <IconeEmailRede />
      </a>
    </div>
  );
}

function FooterColunaLinks({ titulo, links }) {
  return (
    <div className="coluna">
      <div className="colunaTitulo">{titulo}</div>
      <div className="colunaLinks">
        {links.map(({ texto, href, target }) => (
          <a key={texto} href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} className="linkNavegacao">{texto}</a>
        ))}
      </div>
    </div>
  );
}

function FooterContato() {
  return (
    <div className="coluna">
      <div className="colunaTitulo">Contato</div>
      <div className="colunaLinks">
        <div className="contatoLinha">
          <span className="contatoIcone"><IconeLocalizacao /></span>
          <span className="contatoTexto">
            IBILCE/UNESP · Rua Cristóvão Colombo, 2265<br/>São José do Rio Preto · SP
          </span>
        </div>
        <div className="contatoLinha contatoLinhaEmail">
          <span className="contatoIcone"><IconeEmailContato /></span>
          <a href="mailto:apoio@semac.cc" onClick={abrirEmail} className="textoEmail">
            apoio@semac.cc
          </a>
        </div>
      </div>
    </div>
  );
}

function FooterBarraInferior() {
  return (
    <>
      <div className="barraInferior">
        <span className="copyright">
          © 2026 SEMAC — XXXVI Semana da Computação · IBILCE/UNESP
        </span>
        {/*<div className="linksLegais">*/}
        {/*  <a href="#" className="linkLegal">Política de Privacidade</a>*/}
        {/*  <a href="#" className="linkLegal">Cookies</a>*/}
        {/*  <a href="#" className="linkLegal">Termos</a>*/}
        {/*</div>*/}
      </div>
    </>
  );
}


const LINKS_NAVEGACAO = [
  { texto: 'Início', href: '#' },
  { texto: 'Sobre', href: '#sobre' },
  { texto: 'Programação', href: '#Cronograma' },
  { texto: 'Patrocinadores', href: '#Patrocinadores' },
  { texto: 'Doação', href: '#doacao' },
  { texto: 'Comissao', href: '#comissao' },
  // { texto: 'Inscrição', href: '#' },


];

const LINKS_PARTICIPANTE = [
  // { texto: 'Entrar', href: '#', target: '_blank' },
  // { texto: 'Minha conta', href: '#', target: '_blank' },
  // { texto: 'Certificados', href: '#', target: '_blank' },
  { texto: 'Transmissão ao vivo', href: 'https://www.youtube.com/@SEMACsjrp', target: '_blank' },
];
// ── Componente principal ───────────────────────────────────────────

export default function FooterNovo() {
  return (

    <footer className="footerNovo" >
      <FooterOnda />
      <div className="corpo">
        {/*<div className="anelDecorativo" />*/}

        <div className="grade">
          <div className="marca">
            <FooterLogo />
            <FooterRedes />
          </div>

          <div className="colunasNav">
            <FooterColunaLinks titulo="Navegação" links={LINKS_NAVEGACAO} />
            <FooterColunaLinks titulo="Participante" links={LINKS_PARTICIPANTE} />
          </div>

          <FooterContato />
        </div>

        <FooterBarraInferior />
      </div>
    </footer>
  );
}
