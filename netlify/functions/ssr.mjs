// Netlify Function v2: SSR handler for TanStack Start
// Uses the Web Request/Response API directly — compatible with TanStack Start's fetch-based server.

import serverApp from '../../dist/server/server.js'

export default async (request) => {
  try {
    return await serverApp.fetch(request)
  } catch (error) {
    console.error('[SSR Error]', error)
    return new Response(
      `<!doctype html><html><body><h1>500 — Server Error</h1><pre>${error?.message ?? String(error)}</pre></body></html>`,
      {
        status: 500,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }
    )
  }
}

export const config = {
  path: '/*',
  preferStatic: true,
}
