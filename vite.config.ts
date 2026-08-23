import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import type { IncomingMessage, ServerResponse } from 'node:http'
import managementProxyHandler from './api/management-proxy.ts'
import deployFunctionProxyHandler from './api/deploy-function-proxy.ts'
import authConfigProxyHandler from './api/auth-config-proxy.ts'

// https://vite.dev/config/

// ── Local /api proxy middleware ──────────────────────────────────────────────
// The Deploy Gateway flow posts to same-origin /api/* endpoints. In production
// those are edge functions (api/*-proxy.ts). During `npm run dev` there is no
// external server, so this plugin mounts the EXACT SAME handler functions
// inside the Vite dev-server process: requests stay on the user's machine and
// are forwarded straight to api.supabase.com from Node's fetch(). No relay
// service, no extra tooling — `npm run dev` alone is enough.

const API_HANDLERS: Record<string, (req: Request) => Promise<Response>> = {
  '/api/management-proxy': managementProxyHandler,
  '/api/deploy-function-proxy': deployFunctionProxyHandler,
  '/api/auth-config-proxy': authConfigProxyHandler,
}

function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? 'localhost'
  const url = `http://${host}${req.url ?? '/'}`
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach(v => headers.append(key, v))
    } else if (value !== undefined) {
      headers.set(key, value)
    }
  }
  const method = (req.method ?? 'GET').toUpperCase()
  const raw = await readRawBody(req)
  return new Request(url, {
    method,
    headers,
    body: raw.length > 0 ? raw : undefined,
  })
}

async function sendWebResponse(webRes: Response, res: ServerResponse): Promise<void> {
  webRes.headers.forEach((value, key) => res.setHeader(key, value))
  res.statusCode = webRes.status
  res.end(Buffer.from(await webRes.arrayBuffer()))
}

function localApiProxies(): Plugin {
  return {
    name: 'keyroute-local-api-proxies',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const route = (req.url ?? '').split('?')[0] ?? ''
        const handler = API_HANDLERS[route]
        if (!handler || !res.writable) return next()
        void toWebRequest(req)
          .then(handler)
          .then(webRes => sendWebResponse(webRes, res))
          .catch(err => {
            // The middleware itself crashed (shouldn't happen — handlers map
            // their own errors) — answer JSON so the UI shows a real message.
            if (!res.headersSent) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
            }
            res.end(JSON.stringify({
              error: { message: `Local dev proxy failed: ${err instanceof Error ? err.message : String(err)}` },
            }))
          })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    localApiProxies(),
    react(),
    tailwindcss(),
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    sourcemap: false,
  },
})
