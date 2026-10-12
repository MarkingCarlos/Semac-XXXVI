import { useState, useRef } from 'preact/hooks';
import ModalInferiorAdmin from '../ModalInferiorAdmin/ModalInferiorAdmin.jsx';
import './seletorModalSubabas.css';

/* Seletor de sub-abas do /admin.
   - Desktop: as pílulas de sempre (listaSubabasAdmin, no admin.css).
   - Mobile (até 820px, o mesmo corte do MenuFabModulos): uma pílula só,
     com a sub-aba ativa. Tocar abre o ModalInferiorAdmin com as opções.
   As duas versões são renderizadas e o CSS esconde a que não vale, para
   não depender de matchMedia no JS. */

export default function SeletorModalSubabas({ subabas, subabaAtiva, aoTrocar, tituloModal, rotuloAcessivel }) {
    const [modalSubabasAberto, setModalSubabasAberto] = useState(false);
    const botaoAbrirModalSubabasRef = useRef(null);

    const subabaAtual = subabas.find((s) => s.id === subabaAtiva) ?? subabas[0];

    function aoFecharModalSubabas() {
        setModalSubabasAberto(false);
        botaoAbrirModalSubabasRef.current?.focus();
    }

    return (
        <>
            {/* ── Desktop: pílulas ─────────────────────────────── */}
            <div className="listaSubabasAdmin listaPilulasSeletorModalSubabas" role="tablist" aria-label={rotuloAcessivel}>
                {subabas.map((subaba) => (
                    <button
                        key={subaba.id}
                        type="button"
                        role="tab"
                        aria-selected={subabaAtiva === subaba.id}
                        className={`botaoSubabaAdmin${subabaAtiva === subaba.id ? ' botaoSubabaAdminAtivo' : ''}`}
                        onClick={() => aoTrocar(subaba.id)}
                    >
                        {subaba.rotulo}
                    </button>
                ))}
            </div>

            {/* ── Mobile: pílula única que abre o modal ─────────── */}
            <button
                type="button"
                ref={botaoAbrirModalSubabasRef}
                className="botaoAtivoSeletorModalSubabas"
                aria-haspopup="dialog"
                aria-expanded={modalSubabasAberto}
                aria-label={`${rotuloAcessivel}: ${subabaAtual?.rotulo}. Toque para trocar`}
                onClick={() => setModalSubabasAberto(true)}
            >
                <span>{subabaAtual?.rotulo}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {modalSubabasAberto && (
                <ModalInferiorAdmin titulo={tituloModal} aoFechar={aoFecharModalSubabas}>
                    {(fecharModalSubabas) => (
                        <ul className="listaOpcoesModalSubabas">
                            {subabas.map((subaba) => {
                                const ativa = subaba.id === subabaAtiva;
                                return (
                                    <li key={subaba.id}>
                                        <button
                                            type="button"
                                            data-foco-inicial={ativa ? true : undefined}
                                            className={
                                                ativa
                                                    ? 'botaoOpcaoModalSubabas botaoOpcaoAtivaModalSubabas'
                                                    : 'botaoOpcaoModalSubabas'
                                            }
                                            aria-current={ativa ? 'true' : undefined}
                                            onClick={() => {
                                                if (!ativa) aoTrocar(subaba.id);
                                                fecharModalSubabas();
                                            }}
                                        >
                                            <span>{subaba.rotulo}</span>
                                            {ativa && (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                    <path d="M20 6 9 17l-5-5" />
                                                </svg>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </ModalInferiorAdmin>
            )}
        </>
    );
}
