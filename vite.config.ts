import { existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

const __dirname = dirname(fileURLToPath(import.meta.url))

function devVaultWriter(): Plugin {
  return {
    name: 'dev-vault-writer',
    configureServer(server) {
      server.middlewares.use('/__dev/save', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { filename, content } = JSON.parse(body)
            if (!filename || typeof content !== 'string') {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'filename and content required' }))
              return
            }
            
            const targetPath = join(__dirname, 'src/content/vault', filename)
            mkdirSync(dirname(targetPath), { recursive: true })
            writeFileSync(targetPath, content, 'utf8')
            
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true, path: targetPath }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(e) }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // App entry switch — public default points at App.tsx; private builds set
  // VITE_USE_DEVTOOLS=true and (when App.dev.tsx exists locally) get the
  // version with the /dev/* route mounted.
  const wantsDev = env.VITE_USE_DEVTOOLS === 'true'
  const devEntry = resolve(__dirname, 'src/App.dev.tsx')
  const publicEntry = resolve(__dirname, 'src/App.tsx')
  const appEntry = wantsDev && existsSync(devEntry) ? devEntry : publicEntry

  return {
    plugins: [
      react(),
      tailwindcss(),
      svgr({ include: '**/*.svg?react' }),
      ...(mode === 'development' ? [devVaultWriter()] : []),
    ],
    resolve: {
      alias: {
        '~app': appEntry,
      },
    },
  }
})
