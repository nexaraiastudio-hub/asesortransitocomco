import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const ACCESS_TOKEN = process.env.ACCESS_TOKEN

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface ChatRequest {
  message: string
  history: Array<{role: 'user' | 'assistant', content: string}>
  context?: string
}

interface ChatResponse {
  response: string
  timestamp: string
  fase?: number | string
}

async function callLegalChat(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/legal-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }

  return response.json()
}

describe('legal-chat Contract Tests', () => {
  let testToken: string

  beforeAll(async () => {
    // Use admin user token for testing
    testToken = process.env.ACCESS_TOKEN || ''
    if (!testToken) {
      throw new Error('ACCESS_TOKEN environment variable required')
    }
  })

  describe('Response Structure', () => {
    it('should return valid response structure', async () => {
      const result = await callLegalChat({
        message: 'test query',
        history: [],
        context: 'normativas'
      })

      expect(result).toHaveProperty('response')
      expect(result).toHaveProperty('timestamp')
      expect(typeof result.response).toBe('string')
      expect(result.response.length).toBeGreaterThan(0)
    })

    it('should include timestamp in ISO format', async () => {
      const result = await callLegalChat({
        message: 'test',
        history: []
      })

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('Context Handling', () => {
    it('should respect context=normativas (add closing)', async () => {
      const result = await callLegalChat({
        message: '¿Cuál es la normativa sobre llantas?',
        history: [],
        context: 'normativas'
      })

      expect(result.response).toContain('¿Algo más en que pueda colaborarte?')
    })

    it('should respect context=situación (no closing)', async () => {
      const result = await callLegalChat({
        message: '¿Cuál es la normativa sobre llantas?',
        history: [],
        context: 'situación en vía pública, con policía o agente de tránsito'
      })

      expect(result.response).not.toContain('¿Algo más en que pueda colaborarte?')
    })

    it('should respect context=accidente (no closing)', async () => {
      const result = await callLegalChat({
        message: '¿Cuál es la normativa sobre llantas?',
        history: [],
        context: 'accidente o choque'
      })

      expect(result.response).not.toContain('¿Algo más en que pueda colaborarte?')
    })
  })

  describe('Greeting Logic', () => {
    it('should include greeting exactly once in first response', async () => {
      const result = await callLegalChat({
        message: 'UN AGENTE ME DETUVO POR LLANTAS',
        history: [],
        context: 'situación en vía pública, con policía o agente de tránsito'
      })

      const greetingCount = (result.response.match(/Saludos\. Soy tu Abogado Asesor/g) || []).length
      expect(greetingCount).toBe(1)
    })

    it('should NOT include greeting in follow-up responses', async () => {
      // First message
      const result1 = await callLegalChat({
        message: 'UN AGENTE ME DETUVO POR LLANTAS',
        history: [],
        context: 'situación en vía pública, con policía o agente de tránsito'
      })

      // Second message
      const result2 = await callLegalChat({
        message: 'bogota,MOTO,transito,uso una tarjeta',
        history: [
          { role: 'user', content: 'UN AGENTE ME DETUVO POR LLANTAS' },
          { role: 'assistant', content: result1.response }
        ],
        context: 'situación en vía pública, con policía o agente de tránsito'
      })

      const greetingCount = (result2.response.match(/Saludos\. Soy tu Abogado Asesor/g) || []).length
      expect(greetingCount).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should return 400 for empty message', async () => {
      const response = await fetch(`http://localhost:54321/functions/v1/legal-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ message: '', history: [] })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid JSON', async () => {
      const response = await fetch(`http://localhost:54321/functions/v1/legal-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: 'invalid json'
      })

      expect(response.status).toBe(400)
    })
  })
})
