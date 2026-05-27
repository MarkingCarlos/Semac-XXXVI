// Pill pulsante que indica o status de confirmação dos patrocinadores da edição atual.
// Exibe um dot laranja animado + label + texto explicativo.

import './statusConfirmacao.css'

export default function StatusConfirmacao({ ano = '2026' }) {
    return (
        <div class="status-confirmacao">
            <div class="status-pill">
                <span class="status-dot" />
                <span class="status-label">{ano} · EM CONFIRMAÇÃO</span>
            </div>
            <p class="status-descricao">
                Os patrocinadores desta edição ainda estão sendo confirmados.<br />
                <strong>Conheça quem já apoiou.</strong>
            </p>
        </div>
    )
}
