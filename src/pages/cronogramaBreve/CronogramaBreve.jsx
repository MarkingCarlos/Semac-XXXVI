import EmBreveHeroText from '../../components/emBreve/EmBreveHeroText.jsx';
import EmBreveInfoCard from '../../components/emBreve/EmBreveInfoCard.jsx';
import { DATA_ANUNCIO } from '../../components/emBreve/tokens.js';
import './cronogramaBreve.css';

const formatarDataICS = (data) =>
  data.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

const adicionarAoCalendario = () => {
  const inicio = formatarDataICS(DATA_ANUNCIO);
  const fim = formatarDataICS(new Date(DATA_ANUNCIO.getTime() + 60 * 60 * 1000));
  const titulo = encodeURIComponent('Anúncio dos palestrantes SEMAC');
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SEMAC//SEMAC XXXVI//PT',
      'BEGIN:VEVENT',
      `DTSTART:${inicio}`,
      `DTEND:${fim}`,
      'SUMMARY:Anúncio dos palestrantes SEMAC',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'semac-palestrantes.ics';
    a.click();
    URL.revokeObjectURL(url);
  } else {
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${inicio}/${fim}`,
      '_blank'
    );
  }
};

const abrirInstagram = () => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    let appAberto = false;
    const onVisibilityChange = () => {
      if (document.hidden) appAberto = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.location.href = 'instagram://user?username=semacsjrp';
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (!appAberto) window.location.href = 'https://www.instagram.com/semacsjrp/';
    }, 1500);
  } else {
    window.open('https://www.instagram.com/semacsjrp/', '_blank');
  }
};

const CronogramaBreve = () => {
  return (
    <section className="paginaCronograma">

      <main className="conteudoPrincipal">
        <EmBreveHeroText />
        <EmBreveInfoCard />
          <div className="grupoDeAcoes">
              <button className="botao botaoPrimario" onClick={adicionarAoCalendario}>Avise-me ↗</button>
              <button className="botao botaoFantasma" onClick={abrirInstagram}>@semac.ibilce</button>
          </div>
      </main>

    </section>
  );
};

export default CronogramaBreve;
