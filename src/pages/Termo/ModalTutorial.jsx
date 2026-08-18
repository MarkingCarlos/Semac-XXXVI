import "./Termo.css";

const ModalTutorial = ({ onFechar }) => (
    <div className="modal-overlay">
        <div className="modal-caixa">
            <button className="modal-fechar" onClick={onFechar}>✕</button>
            <p>O objetivo do <strong>Termo</strong> é descobrir a palavra certa em 6 tentativas. À cada tentativa, as peças mostram o quão perto você está da solução.</p>
            <p><strong>Exemplo:</strong></p>
            <div className="modal-exemplo">
                {[
                    { letra: "T", estado: "presente" },
                    { letra: "E", estado: "presente" },
                    { letra: "R", estado: "ausente"  },
                    { letra: "M", estado: "ausente"  },
                    { letra: "O", estado: "certo"    },
                ].map(({ letra, estado }) => (
                    <div key={letra} className={`termo-celula celula-${estado}`}>{letra}</div>
                ))}
            </div>
            <p>A letra <span className="tag certo">O</span> faz parte da palavra e está na posição certa.</p>
            <p>As letras <span className="tag presente">T</span> e <span className="tag presente">E</span> fazem parte da palavra, mas em outra posição.</p>
            <p>As letras <span className="tag ausente">R</span> e <span className="tag ausente">M</span> não fazem parte da palavra.</p>
            <p>Os acentos são preenchidos automaticamente e não são considerados nas dicas.</p>
            <p>As palavras podem possuir letras repetidas.</p>
        </div>
    </div>
);

export default ModalTutorial;