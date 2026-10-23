import { useState, useEffect } from 'preact/hooks';
import { listarDesafiosCifraAdmin } from '../data/apiDesafioCifra.js';
import TextoCifra from '../../../components/campoOtpCifra/textoCifra.jsx';
import './desafioCifraAdmin.css';

/* Cifra do Dia — os desafios diários de /desafio-cifra (tabelas
   `desafio_cifra` e `desafio_cifra_etapa`). Bloco da sub-aba Gamificação
   de Informações SEMAC, ao lado do Termo e para o mesmo público (quem
   monta ou não este componente é o InformacoesSemac.jsx).

   Só leitura, de propósito: os desafios entram por migration no backend
   (V64 terça, V65 quarta, ...). Cifra e resposta passam por conferência
   antes de ir ao ar, e editar pela tela no meio da semana mexeria na
   resposta de quem já está jogando. Aqui a diretoria vê cada desafio,
   revela a resposta e abre o modo teste.

   As respostas voltam na leitura, mas ficam mascaradas até alguém clicar
   em "Mostrar" — mesmo cuidado do TermoAdmin com compartilhamento de
   tela. */

const ANO_ATUAL = new Date().getFullYear();

const formatarDataCifraAdmin = (data) => {
    if (!data) return '—';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
};

const rotuloEtapaCifraAdmin = (indice, total) => {
    if (total === 1) return 'Resposta';
    return indice < total - 1 ? 'Etapa 1 · senha parcialmente descriptografada' : 'Etapa 2 · resposta final';
};

/* Tamanho de cada bloco de casas, como a tela do participante desenha:
   "MAKE THEM BELIEVE" -> 4 · 4 · 7. */
const gruposRespostaCifraAdmin = (resposta) =>
    resposta.trim().split(/\s+/).filter(Boolean).map((bloco) => Array.from(bloco).length);

export default function DesafioCifraAdmin() {
    const [desafios, setDesafios] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    /* Chaves `${desafio}-${etapa}` com a resposta revelada. Não persiste:
       recarregar a página mascara todas de novo. */
    const [respostasVisiveisCifraAdmin, setRespostasVisiveisCifraAdmin] = useState(() => new Set());

    useEffect(() => {
        let ativo = true;
        listarDesafiosCifraAdmin(ANO_ATUAL)
            .then((lista) => { if (ativo) setDesafios(lista); })
            .catch((e) => { if (ativo) setErro(e.message); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    const alternarVisibilidadeResposta = (chave) => {
        setRespostasVisiveisCifraAdmin((prev) => {
            const proximo = new Set(prev);
            if (proximo.has(chave)) proximo.delete(chave);
            else proximo.add(chave);
            return proximo;
        });
    };

    return (
        <section className="blocoInfoSemac" aria-label="Cifra do Dia">
            <div className="cabecalhoBlocoInfoSemac">
                <div>
                    <h2 className="tituloBlocoInfoSemac">Criptografia </h2>
                </div>
            </div>

            {erro && <p className="avisoErroAdmin" role="alert">{erro}</p>}

            <p className="pAvisoDesafioCifraAdmin">
                Um desafio por data, com 5 erros permitidos.
            </p>

            {carregando && <p className="estadoCarregandoParticipantesAdmin">Carregando desafios…</p>}

            {!carregando && !erro && desafios.length === 0 && (
                <p className="pAvisoDesafioCifraAdmin">Nenhum desafio cadastrado para {ANO_ATUAL}.</p>
            )}

            {!carregando && desafios.length > 0 && (
                <div className="divListaDesafiosCifraAdmin">
                    {desafios.map((desafio) => (
                        <article key={desafio.id} className="divCartaoDesafioCifraAdmin">
                            <div className="divCabecalhoCartaoDesafioCifraAdmin">
                                <span className="spanDataDesafioCifraAdmin">{formatarDataCifraAdmin(desafio.data)}</span>
                                <span className="spanEtiquetaDesafioCifraAdmin">
                                    {desafio.jogadores} {desafio.jogadores === 1 ? 'jogador' : 'jogadores'} · {desafio.vencedores} decifraram
                                </span>
                            </div>

                            <dl className="dlDadosDesafioCifraAdmin">
                                <div className="divItemDadosDesafioCifraAdmin">
                                    <dt className="dtRotuloDesafioCifraAdmin">Palestra</dt>
                                    <dd className="ddValorDesafioCifraAdmin">{desafio.palestra}</dd>
                                </div>
                                <div className="divItemDadosDesafioCifraAdmin">
                                    <dt className="dtRotuloDesafioCifraAdmin">Senha criptografada</dt>
                                    <dd className="ddValorDesafioCifraAdmin ddSenhaDesafioCifraAdmin">
                                        <TextoCifra texto={desafio.senhaCifrada} />
                                    </dd>
                                </div>
                            </dl>

                            {desafio.etapas.map((etapa, indice) => {
                                const chaveVisibilidade = `${desafio.id}-${etapa.ordem}`;
                                const visivel = respostasVisiveisCifraAdmin.has(chaveVisibilidade);
                                const grupos = gruposRespostaCifraAdmin(etapa.resposta);
                                const totalCaracteres = grupos.reduce((soma, tamanho) => soma + tamanho, 0);
                                return (
                                    <section key={etapa.ordem} className="sectionEtapaDesafioCifraAdmin">
                                        <span className="spanTituloEtapaDesafioCifraAdmin">
                                            {rotuloEtapaCifraAdmin(indice, desafio.etapas.length)}
                                        </span>

                                        <div className="divRespostaDesafioCifraAdmin">
                                            <strong
                                                className={visivel
                                                    ? 'strongRespostaDesafioCifraAdmin'
                                                    : 'strongRespostaDesafioCifraAdmin strongRespostaMascaradaDesafioCifraAdmin'}
                                                aria-label={visivel ? undefined : `Resposta oculta de ${totalCaracteres} caracteres`}
                                            >
                                                {visivel ? <TextoCifra texto={etapa.resposta} /> : '•'.repeat(totalCaracteres)}
                                            </strong>
                                            <button
                                                type="button"
                                                className="botaoFantasmaFinancas"
                                                aria-pressed={visivel}
                                                onClick={() => alternarVisibilidadeResposta(chaveVisibilidade)}
                                            >
                                                {visivel ? 'Ocultar' : 'Mostrar'}
                                            </button>
                                        </div>
                                        <span className="spanCasasDesafioCifraAdmin">
                                            {totalCaracteres} casas{grupos.length > 1 && ` · ${grupos.join(' · ')}`}
                                        </span>

                                        <p className="pDicaDesafioCifraAdmin">
                                            <span className="spanRotuloDicaDesafioCifraAdmin">Dica: </span>
                                            {etapa.dica}
                                        </p>
                                    </section>
                                );
                            })}

                            {/* Abre o jogo deste desafio em nova guia, de qualquer
                                data, sem gravar jogo nem creditar xp. */}
                            <div className="divAcoesDesafioCifraAdmin">
                                <a
                                    className="botaoPrimarioFinancas linkTestarDesafioCifraAdmin"
                                    href={`/desafio-cifra/teste?desafio=${desafio.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Testar
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
