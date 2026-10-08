// Environment variable validation and type-safe access

interface EnvConfig {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_PUBLISHABLE_KEY: string
}

function getEnvVar(key: keyof EnvConfig): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(\`Missing required environment variable: \${key}\`)
  }
  return value
}

export const env = {
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
  supabasePublishableKey: getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY'),
} as const

// Type-safe access
export type Env = typeof env
