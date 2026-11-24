import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import { Buffer } from 'node:buffer'
import { cwd } from 'node:process'
import react from '@vitejs/plugin-react'

const groqProxy = apiKey => {
  const handler = async (request, response) => {
    if (request.method !== 'POST') {
      response.writeHead(405, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: { message: 'Method not allowed' } }))
      return
    }
    if (!apiKey) {
      response.writeHead(503, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: { message: 'Groq is not configured on this server.' } }))
      return
    }

    try {
      const chunks = []
      let size = 0
      for await (const chunk of request) {
        size += chunk.length
        if (size > 25 * 1024 * 1024) throw new Error('Request is too large (25 MB limit).')
        chunks.push(chunk)
      }
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: Buffer.concat(chunks),
      })
      response.writeHead(groqResponse.status, { 'Content-Type': groqResponse.headers.get('content-type') || 'application/json' })
      response.end(Buffer.from(await groqResponse.arrayBuffer()))
    } catch (error) {
      const tooLarge = error.message.includes('25 MB')
      response.writeHead(tooLarge ? 413 : 502, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: { message: tooLarge ? error.message : 'Could not reach Groq from this server. Check server network access and try again.' } }))
    }
  }

  return {
    name: 'urvara-groq-server-proxy',
    configureServer(server) { server.middlewares.use('/api/groq', handler) },
    configurePreviewServer(server) { server.middlewares.use('/api/groq', handler) },
  }
}

const mandiProxy = apiKey => {
  const resourceId = '9ef84268-d588-465a-a308-a864a43d0070'
  const upstream = `https://api.data.gov.in/resource/${resourceId}`
  const cacheTtlMs = 60_000
  const staleTtlMs = 30 * 60_000
  const cache = new Map()
  const fields = ['state', 'district', 'market', 'commodity', 'variety', 'grade', 'arrival_date', 'min_price', 'max_price', 'modal_price']

  const send = (response, status, payload) => {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify(payload))
  }

  const handler = async (request, response) => {
    if (request.method !== 'GET') return send(response, 405, { error: { message: 'Use GET to retrieve market observations.' } })
    if (!apiKey) return send(response, 503, { error: { message: 'Market data is not configured on this server.' } })

    const query = new URL(request.url, 'http://localhost').searchParams
    const allowed = new Set(['state', 'district', 'market', 'commodity', 'limit', 'offset'])
    for (const key of query.keys()) {
      if (!allowed.has(key)) return send(response, 400, { error: { message: `Unsupported query parameter: ${key}.` } })
      if (query.getAll(key).length !== 1) return send(response, 400, { error: { message: `Provide ${key} only once.` } })
    }

    const filters = {}
    for (const key of ['state', 'district', 'market', 'commodity']) {
      const value = query.get(key)?.trim()
      if (value !== undefined && value !== null) {
        const hasControlCharacter = [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
        if (!value || value.length > 80 || hasControlCharacter) return send(response, 400, { error: { message: `${key} must be 1–80 printable characters.` } })
        filters[key] = value
      }
    }
    const parseIntParam = (key, fallback, min, max) => {
      const value = query.get(key)
      if (value === null) return fallback
      if (!/^\d+$/.test(value)) return null
      const number = Number(value)
      return Number.isSafeInteger(number) && number >= min && number <= max ? number : null
    }
    const limit = parseIntParam('limit', 20, 1, 100)
    const offset = parseIntParam('offset', 0, 0, 50_000)
    if (limit === null) return send(response, 400, { error: { message: 'limit must be an integer from 1 to 100.' } })
    if (offset === null) return send(response, 400, { error: { message: 'offset must be an integer from 0 to 50000.' } })

    const cacheKey = JSON.stringify({ filters, limit, offset })
    const now = Date.now()
    const prior = cache.get(cacheKey)
    if (prior && now - prior.cachedAt < cacheTtlMs) return send(response, 200, { ...prior.payload, cache: 'fresh' })

    const params = new URLSearchParams({ 'api-key': apiKey, format: 'json', limit: String(limit), offset: String(offset) })
    for (const [key, value] of Object.entries(filters)) params.set(`filters[${key}]`, value)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12_000)
    try {
      const upstreamResponse = await fetch(`${upstream}?${params}`, { headers: { Accept: 'application/json' }, signal: controller.signal })
      if (!upstreamResponse.ok) {
        const status = upstreamResponse.status === 429 ? 503 : 502
        let message
        if (upstreamResponse.status === 429) message = 'The market data service is rate-limiting requests. Please try again shortly.'
        else if ([401, 403].includes(upstreamResponse.status)) message = `The market data service rejected server authentication (HTTP ${upstreamResponse.status}). Check the server API configuration.`
        else if (upstreamResponse.status === 404) message = 'The configured market data resource was not found (HTTP 404).'
        else if (upstreamResponse.status >= 500) message = `The market data service is temporarily unavailable (HTTP ${upstreamResponse.status}). Please try again later.`
        else message = `The market data service returned HTTP ${upstreamResponse.status}. Please try again later.`
        throw Object.assign(new Error(message), { status })
      }
      const contentType = upstreamResponse.headers.get('content-type') || ''
      if (!contentType.toLowerCase().includes('json')) throw Object.assign(new Error('The market data service returned an unexpected response format.'), { status: 502 })
      const data = await upstreamResponse.json()
      const validMetadata = data?.status === 'ok' && Array.isArray(data.records) && Number.isFinite(Number(data.total)) && Number.isFinite(Number(data.count))
      const validRecords = validMetadata && data.records.every(record => record && fields.every(field => Object.hasOwn(record, field)) && ['min_price', 'max_price', 'modal_price'].every(field => Number.isFinite(Number(record[field]))))
      if (!validRecords) throw Object.assign(new Error('The market data service returned incomplete or invalid market records.'), { status: 502 })

      const payload = {
        source: { name: 'AGMARKNET via data.gov.in', resourceId, url: `https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi`, unit: 'INR per quintal', unitSourceUrl: 'https://event.data.gov.in/wp-content/uploads/2016/03/Opendataapps_challenge_final.pdf' },
        metadata: { status: data.status, total: Number(data.total), count: Number(data.count), limit: Number(data.limit ?? limit), offset: Number(data.offset ?? offset), fields, retrievedAt: new Date().toISOString() },
        records: data.records,
        stale: false,
      }
      cache.set(cacheKey, { payload, cachedAt: now })
      for (const [key, value] of cache) if (now - value.cachedAt > staleTtlMs) cache.delete(key)
      while (cache.size > 80) cache.delete(cache.keys().next().value)
      return send(response, 200, { ...payload, cache: 'miss' })
    } catch (error) {
      if (prior && now - prior.cachedAt < staleTtlMs) return send(response, 200, { ...prior.payload, stale: true, cache: 'stale' })
      const status = error.name === 'AbortError' ? 504 : error.status || 502
      const message = error.name === 'AbortError' ? 'The market data request timed out. Please try again.' : error.message || 'Market data is temporarily unavailable.'
      return send(response, status, { error: { message } })
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    name: 'urvara-mandi-server-proxy',
    configureServer(server) { server.middlewares.use('/api/mandi', handler) },
    configurePreviewServer(server) { server.middlewares.use('/api/mandi', handler) },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')
  return {
    plugins: [react(), groqProxy(env.GROQ_API_KEY), mandiProxy(env.DATA_GOV_IN_API_KEY)],
  }
})
