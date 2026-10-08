# Cambios Recientes - AsesorTransitoComCo App

## Fecha: 2 de septiembre de 2026

## 1. Corrección de Saludo Duplicado

**Problema:** El saludo `((Saludos. Soy tu Abogado Asesor Élite en Tránsito y Transporte...))` aparecía duplicado o repetido en las respuestas de la fase 2, 2b, 3 y 4.

**Solución:**
- Se mejoró la función `aplicarBloquesFijos` en `supabase/functions/legal-chat/index.ts`
- Se reemplazaron los patrones regex con versiones más robustas que:
  - Eliminan `((Saludos...))` con paréntesis dobles
  - Eliminan saludos al inicio sin paréntesis
  - Eliminan `((PROTOCOLO DE SEGURIDAD...))`
- Se aseguró que el saludo solo aparezca en Fase 1
- En Fases 2/2b/3/4: el saludo se elimina completamente

**Verificación:** Saludo aparece 1 vez en Fase 1, 0 veces en Fases 2/2b/3/4

## 2. Deshabilitación de Respuesta de Audio (TTS)

**Problema:** La función de texto-a-voz repetía todo el contenido de la respuesta.

**Solución:**
- `src/pages/Chat.tsx`:
  - `toggleSpeak` convertida a no-op
  - `setTimeout` de autoplay TTS convertido a no-op

**Verificación:** No se genera ni reproduce audio

## 3. Corrección de Configuración de API Key

**Problema:** La API key estaba como OpenRouter (`sk-or-...`) pero el código usa cliente OpenAI, causando error 401.

**Solución:**
- Reemplazada OpenRouter key con OpenAI key real (`sk-proj-...`)
- `supabase/functions/legal-chat/index.ts`:
  - Removidos fallbacks hardcodeados `sk-fake...ting`
- Configurado secreto via `supabase secrets set`
- Actualizado `.env` y `supabase/functions/.env`

**Verificación:** Función `legal-chat` responde correctamente

## 4. Corrección de Duplicado de Función

**Problema:** Código duplicado en `aplicarBloquesFijos` causaba error de sintaxis TS.

**Solución:** Eliminado bloque duplicado huérfano

**Verificación:** Edge Runtime sin errores de compilación

## Archivos Modificados

1. `supabase/functions/legal-chat/index.ts`
2. `src/pages/Chat.tsx`
3. `.env`
4. `supabase/functions/.env`

## Estado del Sistema

- Edge Runtime: puerto 8081 (healthy)
- Kong Gateway: puerto 8080 (healthy)
- Frontend (Vite): http://localhost:8081
- Backend API: http://localhost:8080
