import { useState, useRef } from 'preact/hooks';
import ModalInferiorAdmin from '../../../components/ModalInferiorAdmin/ModalInferiorAdmin.jsx';
import { urlImagemConquista } from '../data/apiConquistas.js';

/* Conquistas do bloco de Informações SEMAC → Gamificação.

   - CartaoConquistaInfoSemac: o cartão completo de uma conquista. É o
     mesmo na grade do desktop e no modal de detalhes do mobile.
   - ModalConquistasInfoSemac (mobile): a grade de cartões não cabe na
     tela, então o bloco mostra só um botão. Ele abre uma lista com os
     nomes; tocar num nome troca a lista pelo modal de detalhes.

   Um modal nunca fica empilhado sobre o outro: a lista desce e só então
   os detalhes sobem (e vice-versa). Fechar os detalhes volta para a
   lista; fechar a lista volta para a página. "Editar" fecha tudo e só
   então abre o PainelLateral de edição do InformacoesSemac. */

/* Conquista automática o sistema concede sozinho; manual alguém da
   diretoria concede lendo o QR do crachá em /checkin. Espelha o enum
   TipoValidacaoConquista do backend — o valor vem do código e não é
   editável aqui. */
const ROTULOS_VALIDACAO_CONQUISTA = {
    AUTOMATICA: 'Automática',
    MANUAL: 'Validada pela comissão',
};

export function CartaoConquistaInfoSemac({ conquista, emEspera, aoEditar, aoTrocarImagem, aoAlternarAtiva, classeExtra = '' }) {
    const urlImagem = urlImagemConquista(conquista.id, conquista.imagemVersao);
    const classeCartao = [
        'cartaoConquistaInfoSemac',
        conquista.ativa && 'cartaoConquistaAtivaInfoSemac',
        classeExtra,
    ].filter(Boolean).join(' ');

    return (
        <div className={classeCartao}>
            <div className="topoCartaoConquistaInfoSemac">
                <div className="molduraImagemConquistaInfoSemac">
                    {urlImagem ? (
                        <img
                            className="imagemConquistaInfoSemac"
                            src={urlImagem}
                            alt={`Imagem da conquista ${conquista.nome}`}
                        />
                    ) : (
                        <span className="semImagemConquistaInfoSemac">sem<br />imagem</span>
                    )}
                </div>

                <div className="textoCartaoConquistaInfoSemac">
                    <span className="nomeConquistaInfoSemac">{conquista.nome}</span>
                    <span className="metaConquistaInfoSemac">
                        {conquista.pontosBase} pontos · raridade {conquista.raridade}
                    </span>
                    <span className="seloValidacaoConquistaInfoSemac">
                        {ROTULOS_VALIDACAO_CONQUISTA[conquista.tipoValidacao] ?? conquista.tipoValidacao}
                    </span>
                </div>
            </div>

            <p className="descricaoConquistaInfoSemac">
                {conquista.descricao || 'Sem descrição — o participante não saberá como conseguir.'}
            </p>

            {conquista.totalConquistado > 0 && (
                <span className="contagemConquistaInfoSemac">
                    {conquista.totalConquistado === 1
                        ? '1 participante já conquistou'
                        : `${conquista.totalConquistado} participantes já conquistaram`}
                </span>
            )}

            <div className="acoesCartaoConquistaInfoSemac">
                <button
                    type="button"
                    className="botaoFantasmaFinancas"
                    onClick={() => aoEditar(conquista)}
                >
                    Editar
                </button>

                <label className="botaoFantasmaFinancas rotuloUploadConquistaInfoSemac">
                    {conquista.imagemVersao ? 'Trocar imagem' : 'Enviar imagem'}
                    <input
                        type="file"
                        accept="image/png"
                        disabled={emEspera}
                        onChange={(e) => {
                            aoTrocarImagem(conquista, e.currentTarget.files?.[0]);
                            e.currentTarget.value = '';
                        }}
                    />
                </label>
            </div>

            <label className="campoCheckboxInfoSemac">
                <input
                    type="checkbox"
                    checked={conquista.ativa}
                    disabled={emEspera}
                    onInput={(e) => aoAlternarAtiva(conquista, e.currentTarget.checked)}
                />
                <span>{conquista.ativa ? 'Ativa para os participantes' : 'Inativa'}</span>
            </label>
        </div>
    );
}

/* `erro` é o erroConquistas do InformacoesSemac: as ações (ativar, trocar
   imagem) continuam lá, e o modal só repete a mensagem, porque a do
   bloco fica atrás do fundo escuro. */
export default function ModalConquistasInfoSemac({
    conquistas, idConquistaEmEspera, erro, aoEditar, aoTrocarImagem, aoAlternarAtiva, aoFechar,
}) {
    /* { tipo: 'lista' } ou { tipo: 'detalhe', id }. */
    const [telaModalConquistas, setTelaModalConquistas] = useState({ tipo: 'lista' });
    /* Para onde ir quando a animação de saída do modal atual terminar.
       Vazio: dos detalhes volta para a lista; da lista fecha tudo. */
    const proximaTelaModalConquistasRef = useRef(null);

    const aoTerminarSaidaModalConquistas = () => {
        const proxima = proximaTelaModalConquistasRef.current;
        proximaTelaModalConquistasRef.current = null;

        if (proxima?.tipo === 'editar') {
            aoFechar();
            aoEditar(proxima.conquista);
        } else if (proxima) {
            setTelaModalConquistas(proxima);
        } else if (telaModalConquistas.tipo === 'detalhe') {
            setTelaModalConquistas({ tipo: 'lista' });
        } else {
            aoFechar();
        }
    };

    const conquistaDetalhe = telaModalConquistas.tipo === 'detalhe'
        ? conquistas.find((c) => c.id === telaModalConquistas.id)
        : null;

    /* `key` diferente em cada tela: o ModalInferiorAdmin precisa remontar
       para animar a entrada de novo, em vez de ser reaproveitado. */
    if (conquistaDetalhe) {
        return (
            <ModalInferiorAdmin
                key={`detalhe-${conquistaDetalhe.id}`}
                titulo={conquistaDetalhe.nome}
                subtitulo={conquistaDetalhe.ativa ? 'Ativa para os participantes' : 'Inativa'}
                aoFechar={aoTerminarSaidaModalConquistas}
            >
                {(fecharModalDetalheConquista) => (
                    <>
                        {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}
                        <CartaoConquistaInfoSemac
                            conquista={conquistaDetalhe}
                            emEspera={idConquistaEmEspera === conquistaDetalhe.id}
                            classeExtra="cartaoConquistaDetalheInfoSemac"
                            aoEditar={(conquista) => {
                                proximaTelaModalConquistasRef.current = { tipo: 'editar', conquista };
                                fecharModalDetalheConquista();
                            }}
                            aoTrocarImagem={aoTrocarImagem}
                            aoAlternarAtiva={aoAlternarAtiva}
                        />
                    </>
                )}
            </ModalInferiorAdmin>
        );
    }

    return (
        <ModalInferiorAdmin
            key="lista"
            titulo={`Conquistas · ${conquistas.length}`}
            aoFechar={aoTerminarSaidaModalConquistas}
        >
            {(fecharModalListaConquistas) => (
                <ul className="listaNomesModalConquistasInfoSemac">
                    {conquistas.map((conquista) => (
                        <li key={conquista.id}>
                            <button
                                type="button"
                                className="botaoNomeModalConquistasInfoSemac"
                                onClick={() => {
                                    proximaTelaModalConquistasRef.current = { tipo: 'detalhe', id: conquista.id };
                                    fecharModalListaConquistas();
                                }}
                            >
                                <span
                                    className={conquista.ativa
                                        ? 'spanStatusModalConquistasInfoSemac spanStatusAtivaModalConquistasInfoSemac'
                                        : 'spanStatusModalConquistasInfoSemac'}
                                    aria-label={conquista.ativa ? 'Ativa' : 'Inativa'}
                                />
                                <span className="spanNomeModalConquistasInfoSemac">{conquista.nome}</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="m9 6 6 6-6 6" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </ModalInferiorAdmin>
    );
}
