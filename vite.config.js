import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base so the built app can be hosted from any path
// (GitHub Pages project sites, a static bucket subpath, etc.)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
