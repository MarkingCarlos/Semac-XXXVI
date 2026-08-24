import './ModalErroPresenca.css';

/* O backend distingue os dois motivos de erro pela mensagem: uuid sem
   inscrição nesse evento ("não cadastrado") ou já com presença marcada
   ("já registrada"). O título muda conforme o caso pra deixar claro de
   cara o que aconteceu, sem o operador precisar ler o parágrafo todo. */
function tituloErro(mensagem) {
    return mensagem.toLowerCase().includes('já registrada') ? 'PRESENÇA JÁ REGISTRADA' : 'NÃO CADASTRADO';
}

export default function ModalErroPresenca({ mensagem, onBuscarManualmente, onFechar }) {
    return (
        <div className="sobreposicaoModalErroPresenca">
            <div className="cartaoModalErroPresenca">
                <div className="formaDecorativaModalErroPresenca" />
                <div className="conteudoModalErroPresenca">
                    <div className="iconeXModalErroPresenca">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </div>
                    <div className="tituloModalErroPresenca">{tituloErro(mensagem)}</div>
                    <div className="mensagemModalErroPresenca">{mensagem}</div>
                    <div className="acoesModalErroPresenca">
                        <button type="button" onClick={onBuscarManualmente} className="botaoBuscarModalErroPresenca">
                            BUSCAR MANUALMENTE
                        </button>
                        <button type="button" onClick={onFechar} className="botaoFecharModalErroPresenca">
                            FECHAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
