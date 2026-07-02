import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
//
// `base` precisa apontar para o subcaminho do repositório quando publicamos no
// GitHub Pages (ex.: usuario.github.io/Valuation-Agrosintropia/). No ambiente
// local ou em WebContainers (StackBlitz), o app roda na raiz "/".
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  base: isGitHubPages ? '/Valuation-Agrosintropia/' : '/',
  plugins: [react()],
});
