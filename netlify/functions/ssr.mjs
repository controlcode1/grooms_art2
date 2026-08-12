// Netlify Function: SSR handler for TanStack Start
// Converts AWS Lambda event ↔ Web Request/Response API

import serverApp from '../../dist/server/server.js'

export const handler = async (event, context) => {
  const host =
    event.headers?.host ||
    event.headers?.Host ||
    'groomsart1.netlify.app'

  const protocol =
    event.headers?.['x-forwarded-proto'] || 'https'

  const rawPath = event.rawPath || event.path || '/'
  const queryString =
    event.rawQueryString ||
    (event.queryStringParameters
      ? new URLSearchParams(event.queryStringParameters).toString()
      : '')

  const url = `${protocol}://${host}${rawPath}${queryString ? '?' + queryString : ''}`

  const method =
    event.requestContext?.http?.method || event.httpMethod || 'GET'

  const requestBody =
    event.body
      ? event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : event.body
      : undefined

  const request = new Request(url, {
    method,
    headers: new Headers(event.headers || {}),
    body: ['GET', 'HEAD'].includes(method) ? undefined : requestBody,
  })

  try {
    const response = await serverApp.fetch(request)

    const headers = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    const bodyBuffer = await response.arrayBuffer()
    const body = Buffer.from(bodyBuffer).toString('base64')

    return {
      statusCode: response.status,
      headers,
      body,
      isBase64Encoded: true,
    }
  } catch (error) {
    console.error('[SSR Error]', error)
    return {
      statusCode: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: `<!doctype html><html><body><h1>500 — Server Error</h1><pre>${error?.message ?? error}</pre></body></html>`,
      isBase64Encoded: false,
    }
  }
}
