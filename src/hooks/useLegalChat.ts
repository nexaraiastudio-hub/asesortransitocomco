import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  attachments?: Array<{ url: string; type: string; name: string }>
}

interface ChatRequest {
  message: string
  history: Message[]
  context?: string
  userName?: string
  attachments?: Message['attachments']
}

interface ChatResponse {
  response: string
  timestamp: string
  fase?: number | string
}

export function useLegalChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ChatRequest) => {
      const { data: { session } } = await supabase.auth.getSession()
      
      const { data, error } = await supabase.functions.invoke('legal-chat', {
        body: request,
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      })

      if (error) {
        const code = (error as any)?.status || (error as any)?.context?.status
        const errorMsg = code === 429
          ? 'Estamos experimentando alta demanda, intenta en un momento. ⏳'
          : code === 402
            ? 'Se agotaron los créditos del servicio. Contacta al administrador.'
            : 'Error de conexión con HIVE-LAW (Código $code). Detalle: ${error.message}'
        throw new Error(errorMsg)
      }

      if (!data?.response) {
        throw new Error('No recibí respuesta. Intenta de nuevo.')
      }

      return data as ChatResponse
    },
    onSuccess: () => {
      // Invalidate any related queries if needed
    },
    onError: (error) => {
      // Error is handled in the component via toast
      console.error('Legal chat error:', error)
    }
  })
}

export function useRestorePurchases() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('restore-purchases')
      if (error) throw error
      return data
    }
  })
}

export function useGrantPremium() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('grant-premium')
      if (error) throw error
      return data
    }
  })
}

