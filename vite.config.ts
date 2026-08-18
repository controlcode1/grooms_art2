import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      routeRules: {
        // ── Public pages — ISR 5 min ──────────────────────────────────
        '/':              { isr: 300 },
        '/about':         { isr: 3600 },
        '/portfolio':     { isr: 300 },
        '/portfolio/**':  { isr: 300 },

        // ── Interactive / private — no cache ─────────────────────────
        '/book-session':  { cache: false },
        '/sessions':      { cache: false },
        '/full-day':      { cache: false },
        '/dashboard/**':  { cache: false },
      },
    }),
    viteReact(),
  ],
})


