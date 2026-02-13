import path from 'path'

import react from '@vitejs/plugin-react'
import { marked } from 'marked'
import type { Plugin } from 'vite'
import { defineConfig, loadEnv } from 'vite'

function markdown(): Plugin {
  return {
    name: 'vite-plugin-markdown',
    async transform(code, id) {
      if (!id.endsWith('.md')) return
      const html = await marked(code)
      return { code: `export default ${JSON.stringify(html)}`, map: null }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [markdown(), react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  }
})
