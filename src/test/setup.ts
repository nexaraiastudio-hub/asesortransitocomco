import { beforeAll, afterAll, vi } from 'vitest'

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key'
  process.env.ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'test-access-token'
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key'
})

afterAll(() => {
  // cleanup
})

vi.setConfig({ testTimeout: 30000 })
