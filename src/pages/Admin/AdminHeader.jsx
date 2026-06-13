// Barra superior fixa da área admin.
// Exibe: link de volta ao site público | título da ferramenta | badge da edição.
export default function AdminHeader() {
    return (
        <header class="cabecalhoAdmin">
            <a href="/" class="linkVoltarAdmin">← Voltar ao site</a>
            <h1 class="tituloCabecalhoAdmin">SEMAC Admin</h1>
            <span class="badgeVersaoAdmin">SEMAC XXXVI</span>
        </header>
    )
}