/* Aba "Perfil": dados da inscrição, conquistas e certificados (quando
   liberados). Nome/e-mail, nível/xp e conquistas vêm de dados reais; só
   os certificados ainda são mock. `nivel` vem null
   enquanto carrega ou quando a pessoa ainda não tem xp atribuído.

   Só chegam aqui as conquistas ativas (ver GET /api/conquista/minhas) —
   o que a presidência ainda não liberou não existe para o participante.
   Dessas, só as desbloqueadas são exibidas; sem nenhuma, o bloco some.

   `meuTime` (GET /api/time/meu/resumo) só chega depois que a pessoa
   revelou o time em /time; null = o bloco "Seu time" não aparece. */

import { useEffect, useState } from 'preact/hooks';
import { Link } from 'wouter';
import CardConquista from '../../../components/CardConquista/CardConquista.jsx';
import { medirMascoteAlongado, urlMascoteTime } from '../../Admin/data/apiTimes.js';

/* "TIME ONDA" → "O": o círculo sem mascote (mesma regra do /time). */
function inicialTimeSecaoPerfil(nome) {
    const palavras = (nome || '').trim().split(/\s+/);
    const principal = palavras.length > 1 && palavras[0].toUpperCase() === 'TIME' ? palavras[1] : palavras[0];
    return (principal || '?').charAt(0).toUpperCase();
}

/* Bloco "Seu time": mascote, nome e posição entre os times. Leva ao /time. */
function CardMeuTimeSecaoPerfil({ meuTime }) {
    const urlMascote = urlMascoteTime(meuTime.id, meuTime.mascoteVersao);
    // false = preenche o círculo; texto = margem do mascote contido (alongado).
    const [margemMascoteSecaoPerfil, setMargemMascoteSecaoPerfil] = useState(false);

    useEffect(() => {
        let ativo = true;
        medirMascoteAlongado(urlMascote).then((margem) => { if (ativo) setMargemMascoteSecaoPerfil(margem); });
        return () => { ativo = false; };
    }, [urlMascote]);

    return (
        <Link
            href="/time"
            className="cardMeuTimeSecaoPerfilParticipantes"
            style={{ '--corMeuTimeSecaoPerfil': meuTime.cor || 'var(--AmareloAuxApoio)' }}
            aria-label={meuTime.rankingOculto
                ? `Seu time: ${meuTime.nome}`
                : `Seu time: ${meuTime.nome}, ${meuTime.posicao}º lugar entre ${meuTime.totalTimes} times`}
        >
            <span className="circuloMascoteMeuTimeSecaoPerfilParticipantes">
                {urlMascote ? (
                    <img
                        className={margemMascoteSecaoPerfil
                            ? 'imgMascoteMeuTimeSecaoPerfilParticipantes imgMascoteContidoMeuTimeSecaoPerfilParticipantes'
                            : 'imgMascoteMeuTimeSecaoPerfilParticipantes'}
                        style={margemMascoteSecaoPerfil ? { padding: margemMascoteSecaoPerfil } : undefined}
                        src={urlMascote}
                        alt=""
                    />
                ) : (
                    <span className="inicialMeuTimeSecaoPerfilParticipantes" aria-hidden="true">
                        {inicialTimeSecaoPerfil(meuTime.nome)}
                    </span>
                )}
            </span>
            <span className="textosMeuTimeSecaoPerfilParticipantes">
                <span className="rotuloMeuTimeSecaoPerfilParticipantes">SEU TIME</span>
                <span className="nomeMeuTimeSecaoPerfilParticipantes">{meuTime.nome}</span>
                {meuTime.rankingOculto ? (
                    <span className="posicaoMeuTimeSecaoPerfilParticipantes">Ranking dos times oculto por enquanto</span>
                ) : (
                    <span className="posicaoMeuTimeSecaoPerfilParticipantes">
                        <strong>{meuTime.posicao}º lugar</strong> entre {meuTime.totalTimes} times · {meuTime.xpTime} de XP
                    </span>
                )}
            </span>
        </Link>
    );
}

export default function SecaoPerfilParticipantes({
    nome,
    email,
    iniciais,
    nivel,
    meuTime,
    conquistas,
    certificados,
    certificadosLiberados,
    onAbrirQr,
    onSair,
}) {
    const conquistasDesbloqueadasPerfil = conquistas.filter((c) => c.desbloqueada);

    return (
        <div className="secaoPerfilParticipantes">
            <div className="dadosParticipante">
                <div className="cabecalhoSecaoPerfilParticipantes">
                    <div className="avatarSecaoPerfilParticipantes">{iniciais}</div>
                    <div className="identidadeSecaoPerfilParticipantes">
                        <span className="nomeSecaoPerfilParticipantes">{nome.toUpperCase()}</span>
                        {nivel && (
                            <span className="seloNivelSecaoPerfilParticipantes">{nivel.nome} · {nivel.xp} XP</span>
                        )}
                    </div>
                </div>

                <div className="botoesSecaoPerfilParticipantes">
                    <button type="button" className="botaoQrSecaoPerfilParticipantes" onClick={onAbrirQr}>MEU QR CODE</button>
                </div>

                <div className="cardDadosInscricaoSecaoPerfilParticipantes">
                    <span className="tituloCardDadosInscricaoSecaoPerfilParticipantes">DADOS DA INSCRIÇÃO</span>
                    <div className="linhaCardDadosInscricaoSecaoPerfilParticipantes">
                        <span className="rotuloLinhaCardDadosInscricaoSecaoPerfilParticipantes">E-mail</span>
                        <span>{email || '—'}</span>
                    </div>
                </div>

                {/* Fecha a coluna de dados, longe do QR CODE: sair é raro e
                    não deve ser tocado sem querer no celular. */}
                <button type="button" className="botaoSairContaSecaoPerfilParticipantes" onClick={onSair}>
                    SAIR DA CONTA
                </button>
            </div>
            {/* Coluna da direita no desktop: o time em cima das conquistas.
                No celular as colunas empilham, e o time fica logo depois
                de "Sair da conta". */}
            {(meuTime || conquistasDesbloqueadasPerfil.length > 0) && (
            <div className="colunaLateralSecaoPerfilParticipantes">
                {meuTime && <CardMeuTimeSecaoPerfil meuTime={meuTime} />}
                {conquistasDesbloqueadasPerfil.length > 0 && (
                <div className="blocoConquistasSecaoPerfilParticipantes">
                    <div className="cabecalhoBlocoSecaoPerfilParticipantes">
                        <span className="rotuloBlocoSecaoPerfilParticipantes">SUAS CONQUISTAS</span>
                        <span className="contadorBlocoSecaoPerfilParticipantes">
                            {conquistasDesbloqueadasPerfil.length} de {conquistas.length}
                        </span>
                    </div>
                    <div className="grelhaConquistasSecaoPerfilParticipantes">
                        {conquistasDesbloqueadasPerfil.map((conquista) => (
                            <CardConquista key={conquista.id} conquista={conquista} />
                        ))}
                    </div>
                </div>
                )}
            </div>
            )}

            {certificadosLiberados && (
                <div className="blocoCertificadosSecaoPerfilParticipantes">
                    <span className="rotuloBlocoSecaoPerfilParticipantes">CERTIFICADOS</span>
                    {certificados.map((certificado) => (
                        <div key={certificado.id} className="cardCertificadoSecaoPerfilParticipantes">
                            <div className="textoCardCertificadoSecaoPerfilParticipantes">
                                <span className="tituloCardCertificadoSecaoPerfilParticipantes">{certificado.titulo}</span>
                                <span className="detalheCardCertificadoSecaoPerfilParticipantes">
                                    {certificado.cargaHoraria} · emitido em {certificado.emitidoEm}
                                </span>
                            </div>
                            <span className="botaoPdfCardCertificadoSecaoPerfilParticipantes">PDF</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
