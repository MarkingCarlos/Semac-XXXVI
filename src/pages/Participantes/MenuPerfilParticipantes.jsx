/* Menu da conta no cabeçalho: o avatar com as iniciais abre um painel com
   a identidade da pessoa, a volta pra página principal (sem derrubar a
   sessão) e o "sair da conta". Fica no cabeçalho, e não na aba Perfil, pra
   continuar ao alcance de qualquer aba. */

import { useEffect, useRef, useState } from 'preact/hooks';

export default function MenuPerfilParticipantes({ nome, email, iniciais, onIrParaPaginaPrincipal, onSair }) {
    const [aberto, setAberto] = useState(false);
    const containerRef = useRef(null);
    const botaoAvatarRef = useRef(null);
    const primeiroItemMenuPerfilRef = useRef(null);

    /* Só escuta o documento enquanto o menu está aberto — fechado, nenhum
       listener fica pendurado. Abrir também joga o foco no primeiro item pra
       quem navega por teclado — de propósito não é o "sair". */
    useEffect(() => {
        if (!aberto) return undefined;

        primeiroItemMenuPerfilRef.current?.focus();

        function fecharSeCliqueForaDoMenuPerfil(evento) {
            if (!containerRef.current?.contains(evento.target)) setAberto(false);
        }

        document.addEventListener('pointerdown', fecharSeCliqueForaDoMenuPerfil);
        return () => document.removeEventListener('pointerdown', fecharSeCliqueForaDoMenuPerfil);
    }, [aberto]);

    /* Escape fecha e devolve o foco pro avatar. Sair pelo Tab (foco caindo
       fora do container) só fecha, sem puxar o foco de volta. */
    function aoTeclarNoMenuPerfil(evento) {
        if (evento.key !== 'Escape' || !aberto) return;
        evento.stopPropagation();
        setAberto(false);
        botaoAvatarRef.current?.focus();
    }

    function aoPerderFocoDoMenuPerfil(evento) {
        if (!containerRef.current?.contains(evento.relatedTarget)) setAberto(false);
    }

    return (
        <div
            ref={containerRef}
            className="containerMenuPerfilCabecalhoParticipantes"
            onKeyDown={aoTeclarNoMenuPerfil}
            onFocusOut={aoPerderFocoDoMenuPerfil}
        >
            <button
                type="button"
                ref={botaoAvatarRef}
                className="avatarCabecalhoParticipantes botaoAvatarMenuPerfilCabecalhoParticipantes"
                aria-haspopup="menu"
                aria-expanded={aberto}
                aria-label="Menu da conta"
                onClick={() => setAberto((estavaAberto) => !estavaAberto)}
            >
                {iniciais}
            </button>

            {aberto && (
                <div className="painelMenuPerfilCabecalhoParticipantes" role="menu">
                    <div className="identidadeMenuPerfilCabecalhoParticipantes">
                        <span className="nomeIdentidadeMenuPerfilCabecalhoParticipantes">{nome.toUpperCase()}</span>
                        {email && (
                            <span className="emailIdentidadeMenuPerfilCabecalhoParticipantes">{email}</span>
                        )}
                    </div>

                    <button
                        type="button"
                        ref={primeiroItemMenuPerfilRef}
                        role="menuitem"
                        className="itemPaginaPrincipalMenuPerfilCabecalhoParticipantes"
                        onClick={onIrParaPaginaPrincipal}
                    >
                        PÁGINA PRINCIPAL
                    </button>

                    <button
                        type="button"
                        role="menuitem"
                        className="itemSairMenuPerfilCabecalhoParticipantes"
                        onClick={onSair}
                    >
                        SAIR DA CONTA
                    </button>
                </div>
            )}
        </div>
    );
}
