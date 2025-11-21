import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ⚙️ Configuração do caminho base para o GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: "/ping-pong/", // 👈 coloque o nome exato do seu repositório aqui
});
