import './ModalErroPresenca.css';

/* O backend distingue os motivos de erro pela mensagem: uuid sem
   inscrição nesse evento ("não cadastrado"), já com presença marcada
   ("já registrada") ou ingresso diário fora dos dias escolhidos (começa
   com "Ingresso diário", ver InscricaoEventoService.exigirDiaDoIngresso).
   O título muda conforme o caso pra deixar claro de cara o que
   aconteceu, sem o operador precisar ler o parágrafo todo. */
function ehErroIngressoDiario(mensagem) {
    return mensagem.toLowerCase().startsWith('ingresso diário');
}

function tituloErro(mensagem) {
    if (ehErroIngressoDiario(mensagem)) return 'INGRESSO NÃO VÁLIDO HOJE';
    return mensagem.toLowerCase().includes('já registrada') ? 'PRESENÇA JÁ REGISTRADA' : 'NÃO CADASTRADO';
}

export default function ModalErroPresenca({ mensagem, onBuscarManualmente, onFechar }) {
    /* Ingresso diário fora do dia não se resolve buscando a pessoa na mão:
       a busca manual passa pela mesma regra. O botão sai para não sugerir
       uma saída que não existe. */
    const ingressoDiario = ehErroIngressoDiario(mensagem);

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
                    {ingressoDiario && (
                        <div className="avisoIngressoDiarioModalErroPresenca">
                            Não libere a entrada. O participante pode trocar os dias do ingresso na área do
                            participante, se o dia ainda não começou.
                        </div>
                    )}
                    <div className="acoesModalErroPresenca">
                        {!ingressoDiario && (
                            <button type="button" onClick={onBuscarManualmente} className="botaoBuscarModalErroPresenca">
                                BUSCAR MANUALMENTE
                            </button>
                        )}
                        <button type="button" onClick={onFechar} className="botaoFecharModalErroPresenca">
                            FECHAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
