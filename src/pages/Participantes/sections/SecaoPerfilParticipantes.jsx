/* Aba "Perfil": dados da inscrição, conquistas e certificados (quando
   liberados). Nome/e-mail vêm da sessão real; o resto ainda é mock. */

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
            <div className="cabecalhoSecaoPerfilParticipantes">
                <div className="avatarSecaoPerfilParticipantes">{iniciais}</div>
                <div className="identidadeSecaoPerfilParticipantes">
                    <span className="nomeSecaoPerfilParticipantes">{nome.toUpperCase()}</span>
                    <span className="cursoSecaoPerfilParticipantes">{perfil.curso}</span>
                    <span className="seloNivelSecaoPerfilParticipantes">NÍVEL {nivel.numero} · {nivel.nome}</span>
                </div>
            </div>

            <div className="botoesSecaoPerfilParticipantes">
                <button type="button" className="botaoQrSecaoPerfilParticipantes" onClick={onAbrirQr}>MEU QR CODE</button>
                <button type="button" className="botaoEditarSecaoPerfilParticipantes">EDITAR DADOS</button>
            </div>

            <div className="cardDadosInscricaoSecaoPerfilParticipantes">
                <span className="tituloCardDadosInscricaoSecaoPerfilParticipantes">DADOS DA INSCRIÇÃO</span>
                <div className="linhaCardDadosInscricaoSecaoPerfilParticipantes">
                    <span className="rotuloLinhaCardDadosInscricaoSecaoPerfilParticipantes">E-mail</span>
                    <span>{email || '—'}</span>
                </div>
                <div className="linhaCardDadosInscricaoSecaoPerfilParticipantes">
                    <span className="rotuloLinhaCardDadosInscricaoSecaoPerfilParticipantes">Inscrição</span>
                    <span>{perfil.numeroInscricao}</span>
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

            <div className="blocoConquistasSecaoPerfilParticipantes">
                <div className="cabecalhoBlocoSecaoPerfilParticipantes">
                    <span className="rotuloBlocoSecaoPerfilParticipantes">CONQUISTAS</span>
                    <span className="contadorBlocoSecaoPerfilParticipantes">
                        {conquistas.filter((c) => c.desbloqueada).length} de {conquistas.length}
                    </span>
                </div>
                <div className="grelhaConquistasSecaoPerfilParticipantes">
                    {conquistas.map((conquista) => (
                        <div
                            key={conquista.id}
                            className={
                                conquista.desbloqueada
                                    ? `itemConquistaSecaoPerfilParticipantes corConquista${capitalizar(conquista.cor)}Participantes`
                                    : 'itemConquistaSecaoPerfilParticipantes itemConquistaBloqueadaSecaoPerfilParticipantes'
                            }
                        >
                            <span className="valorItemConquistaSecaoPerfilParticipantes">{conquista.valorExibido}</span>
                            <span className="rotuloItemConquistaSecaoPerfilParticipantes">{conquista.rotulo}</span>
                        </div>
                    ))}
                </div>
            </div>

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

            <span className="botaoSairSecaoPerfilParticipantes" onClick={onSair}>SAIR DA CONTA</span>
        </div>
    );
}

function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
