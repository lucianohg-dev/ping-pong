// Adicione esta linha:
import { defineConfig } from 'vite'; 
import react from '@vitejs/plugin-react';

// ⚙️ Configuração do caminho base para o GitHub Pages
export default defineConfig({
  plugins: [react()],
  // Você corrigiu esta linha para caminhos relativos:
  base: './', 
});