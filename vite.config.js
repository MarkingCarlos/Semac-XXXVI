import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  // MERCADOPAGOKEY (chave pública do Mercado Pago) não segue o padrão
  // VITE_* do resto do projeto — precisa entrar aqui pra ficar exposta
  // ao bundle do cliente (import.meta.env), igual VITE_ já fica por padrão.
  envPrefix: ['VITE_', 'MERCADOPAGOKEY'],
  server: {
    allowedHosts: true
  }

})
