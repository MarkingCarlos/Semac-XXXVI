
import './btnContato.css';

const BtnContato = () => {
    const handleClick = () => {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = 'mailto:mc.castilho@unesp.br';
        } else {
            window.open('https://mail.google.com/mail/?view=cm&to=mc.castilho@unesp.br', '_blank');
        }
    };

    return (
        <div>
            <button className="btn sombreamentoBtn" onClick={handleClick}>Contato</button>
        </div>
    );
};

export default BtnContato;
