// Barra superior fixa da área admin.
// Exibe: link de volta ao site público | título da ferramenta | badge da edição.
export default function AdminHeader() {
    return (
        <header class="admin-header">
            <a href="/" class="admin-voltar">← Voltar ao site</a>
            <h1 class="admin-header-titulo">SEMAC Admin</h1>
            <span class="admin-badge-versao">SEMAC XXXVI</span>
        </header>
    )
}