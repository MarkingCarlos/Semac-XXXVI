/* Aba "Perfil": dados da inscrição, conquistas e certificados (quando
   liberados). Nome/e-mail, nível/xp e conquistas vêm de dados reais; o
   resto (curso, minicursos, presenças, certificados) ainda é mock. `nivel` vem null
   enquanto carrega ou quando a pessoa ainda não tem xp atribuído.

   Só chegam aqui as conquistas ativas (ver GET /api/conquista/minhas) —
   o que a presidência ainda não liberou não existe para o participante. */

import CardConquista from '../../../components/CardConquista/CardConquista.jsx';

export default function SecaoPerfilParticipantes({
    nome,
    email,
    iniciais,
    nivel,
    perfil,
    conquistas,
    certificados,
    certificadosLiberados,
    onAbrirQr,
    onSair,
}) {
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
                    <div className="linhaCardDadosInscricaoSecaoPerfilParticipantes">
                        <span className="rotuloLinhaCardDadosInscricaoSecaoPerfilParticipantes">Minicursos</span>
                        <span>{perfil.minicursosUsados} de {perfil.minicursosTotais} vagas usadas</span>
                    </div>
                    <div className="linhaCardDadosInscricaoSecaoPerfilParticipantes">
                        <span className="rotuloLinhaCardDadosInscricaoSecaoPerfilParticipantes">Presenças</span>
                        <span>{perfil.presencas} de {perfil.presencasTotais} atividades</span>
                    </div>
                </div>

                {/* Fecha a coluna de dados, longe do QR CODE: sair é raro e
                    não deve ser tocado sem querer no celular. */}
                <button type="button" className="botaoSairContaSecaoPerfilParticipantes" onClick={onSair}>
                    SAIR DA CONTA
                </button>
            </div>
            {conquistas.length > 0 && (
            <div className="blocoConquistasSecaoPerfilParticipantes">
                <div className="cabecalhoBlocoSecaoPerfilParticipantes">
                    <span className="rotuloBlocoSecaoPerfilParticipantes">CONQUISTAS</span>
                    <span className="contadorBlocoSecaoPerfilParticipantes">
                        {conquistas.filter((c) => c.desbloqueada).length} de {conquistas.length}
                    </span>
                </div>
                <div className="grelhaConquistasSecaoPerfilParticipantes">
                    {conquistas.map((conquista) => (
                        <CardConquista key={conquista.id} conquista={conquista} />
                    ))}
                </div>
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
