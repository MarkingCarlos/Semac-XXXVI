import './listaItensMobileAdmin.css';

/* Lista do mobile (até 820px) que substitui as tabelas do /admin, que lá
   não cabem: só o nome de cada item, e o toque abre o modal de detalhes
   (ModalInferiorAdmin) de quem usa. Usada em Pessoas (participantes e
   comissão) e Conteúdo (eventos, brindes, sorteios).

   No desktop some; a tabela correspondente leva `tabelaOcultaMobileAdmin`
   para sumir no mobile. Enquanto carrega, quem usa passa o texto de
   carregamento em `textoVazio`. */

export default function ListaItensMobileAdmin({ itens, textoVazio, aoSelecionar }) {
    if (itens.length === 0) {
        return <p className="vazioListaItensMobileAdmin">{textoVazio}</p>;
    }

    return (
        <ul className="listaItensMobileAdmin">
            {itens.map((item) => (
                <li key={item.id}>
                    <button
                        type="button"
                        className="botaoItemListaMobileAdmin"
                        aria-label={`Ver detalhes de ${item.nome}`}
                        onClick={() => aoSelecionar(item)}
                    >
                        <span className="nomeItemListaMobileAdmin">{item.nome}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>
                </li>
            ))}
        </ul>
    );
}
