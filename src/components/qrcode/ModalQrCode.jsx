import { useEffect, useState } from 'preact/hooks';
import TelaSelecaoModoCheckin from './TelaSelecaoModoCheckin.jsx';
import TelaSelecaoEventoCheckin from './TelaSelecaoEventoCheckin.jsx';
import TelaSelecaoConquistaCheckin from './TelaSelecaoConquistaCheckin.jsx';
import TelaCameraCheckin from './TelaCameraCheckin.jsx';
import {
    listarConquistasManuaisCheckin,
    registrarPresencaPorQrCode,
    concederConquistaPorQrCode,
    testarLeituraQrCode,
} from './data/apiCheckin.js';
import { temAcessoDiretoria } from '../../auth/sessao.js';
import './ModalQrCode.css';

/* Ferramenta usada durante o evento, na rota /checkin. Dois modos, com a
   mesma câmera por trás (só leitura de QR — não há busca manual):

   1. Marcar presença — escolhe a palestra/minicurso e lê os crachás.
      Qualquer papel de comissão pode.

   2. Conceder conquista — escolhe uma conquista manual (o cartaz
      carimbado, por exemplo) e lê os crachás de quem cumpriu. Restrito a
      diretores e presidência, porque credita pontos que mexem no ranking.

   A tela da câmera não sabe qual dos dois está rodando: recebe uma
   `operacao` com o que chamar e como exibir o resultado (ver
   TelaCameraCheckin). É isto que monta essa operação. */
const ModalQrCode = () => {
    const [modo, setModo] = useState(null); // null | 'presenca' | 'conquista' | 'teste'
    const [operacao, setOperacao] = useState(null);
    const [conquistasManuais, setConquistasManuais] = useState([]);

    const podeConcederConquista = temAcessoDiretoria();

    /* Carregado já na abertura para a tela de modos saber se há conquista
       manual ativa — sem isso o botão levaria a uma lista vazia. Falha em
       silêncio: sem conquistas, o modo aparece desabilitado, que é a
       mesma coisa que o usuário veria. */
    /* Trava a rolagem da página enquanto o /checkin está aberto: a tela é
       um app de altura fixa (ver .containerPrincipalCheckin). O Lenis
       (rolagem suave global, index.html) também para, senão ele ainda
       move a página com o toque. */
    useEffect(() => {
        const raiz = document.documentElement;
        const overflowAnteriorRaiz = raiz.style.overflow;
        const overflowAnteriorCorpo = document.body.style.overflow;
        raiz.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        window.lenis?.stop();
        return () => {
            raiz.style.overflow = overflowAnteriorRaiz;
            document.body.style.overflow = overflowAnteriorCorpo;
            window.lenis?.start();
        };
    }, []);

    useEffect(() => {
        if (!podeConcederConquista) return;
        let ativo = true;
        listarConquistasManuaisCheckin()
            .then((lista) => { if (ativo) setConquistasManuais(lista ?? []); })
            .catch(() => {});
        return () => { ativo = false; };
    }, [podeConcederConquista]);

    function iniciarPresenca(evento) {
        setOperacao({
            titulo: `${evento.data.split('-').reverse().slice(0, 2).join('/')} · ${evento.hora}`,
            subtitulo: evento.nome,
            porUuid: (uuid) => registrarPresencaPorQrCode(evento.id, uuid),
            normalizar: (dto) => ({
                titulo: 'PRESENÇA CONFIRMADA',
                nome: dto.nome,
                info: dto.infoAdicional,
                xpTexto: dto.xpGanho > 0 ? `+${dto.xpGanho} XP` : 'Sem XP (atraso)',
                xpZerado: !(dto.xpGanho > 0),
                detalhe: dto.atrasoMinutos > 0 ? `atraso de ${dto.atrasoMinutos} min` : null,
            }),
        });
    }

    /* Teste de leitura: vai direto para a câmera, sem escolher alvo. Só
       mostra de quem é o QR — nada é registrado (ver CheckinTesteController). */
    function iniciarTeste() {
        setModo('teste');
        setOperacao({
            titulo: 'TESTE',
            subtitulo: 'Nada é registrado',
            porUuid: testarLeituraQrCode,
            normalizar: (dto) => ({
                titulo: 'LEITURA OK',
                nome: dto.nome,
                info: dto.situacao,
                xpTexto: null,
            }),
        });
    }

    function iniciarConquista(conquista) {
        setOperacao({
            titulo: 'CONQUISTA',
            subtitulo: conquista.nome,
            porUuid: (uuid) => concederConquistaPorQrCode(conquista.id, uuid),
            normalizar: (dto) => ({
                titulo: 'CONQUISTA CONCEDIDA',
                nome: dto.participanteNome,
                info: dto.conquistaNome,
                xpTexto: `+${dto.pontosCreditados} XP`,
                xpZerado: false,
                detalhe: dto.nivelAtual ? `${dto.nivelAtual} · ${dto.xpTotal} XP` : null,
            }),
        });
    }

    /* Voltar da câmera devolve à escolha do alvo (evento ou conquista),
       não à escolha de modo: quem está numa fila normalmente quer trocar
       de palestra, não de ferramenta. */
    function voltarDaCamera() {
        setOperacao(null);
        // O teste não tem alvo para escolher: volta direto aos modos.
        if (modo === 'teste') setModo(null);
    }

    function voltarParaModos() {
        setOperacao(null);
        setModo(null);
    }

    return (
        <div className="containerPrincipalCheckin">
            <div className="telaAppCheckin">

                <div className="corpoAppCheckin">
                    {operacao ? (
                        <TelaCameraCheckin operacao={operacao} onVoltar={voltarDaCamera} />
                    ) : modo === 'presenca' ? (
                        <TelaSelecaoEventoCheckin onIniciar={iniciarPresenca} onVoltar={voltarParaModos} />
                    ) : modo === 'conquista' ? (
                        <TelaSelecaoConquistaCheckin
                            conquistas={conquistasManuais}
                            onEscolher={iniciarConquista}
                            onVoltar={voltarParaModos}
                        />
                    ) : (
                        <TelaSelecaoModoCheckin
                            podeConcederConquista={podeConcederConquista}
                            conquistasDisponiveis={conquistasManuais.length}
                            onEscolherPresenca={() => setModo('presenca')}
                            onEscolherConquista={() => setModo('conquista')}
                            onEscolherTeste={iniciarTeste}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalQrCode;
