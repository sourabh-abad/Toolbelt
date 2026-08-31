import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Absolute base: routes like /cron are real paths, so assets must resolve
// from the site root rather than relative to the current directory.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
})
