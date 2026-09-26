import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Absolute base: routes like /cron are real paths, so assets must resolve
// from the site root rather than relative to the current directory.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    // dist/.vite/manifest.json maps each page module to its chunk and imports.
    // scripts/prerender.mjs reads it to add <link rel="modulepreload"> for the
    // route's own code, and to build the service worker's precache list.
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react'
          }
        },
      },
    },
  },
})
