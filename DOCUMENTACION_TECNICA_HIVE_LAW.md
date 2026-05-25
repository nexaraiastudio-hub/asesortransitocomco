# HIVE-LAW - Documentación Técnica Completa
## Sistema de Asesoría Legal en Tránsito y Transporte (Colombia)

---

## 1. RESUMEN DEL PROYECTO

**Nombre:** HIVE-LAW  
**Versión actual:** V19 (Orquestador Adaptativo)  
**Estado:** En desarrollo - requiere refinamiento de lógica de razonamiento  
**Tecnología:** Supabase Edge Functions (Deno/TypeScript) + OpenAI GPT-4o  

### Objetivo
Crear un sistema inteligente que asesore a usuarios en casos de tránsito en Colombia, con capacidad de:
- Detectar el tema específico del caso
- Hacer preguntas adaptativas relevantes
- Generar guiones de defensa legales con normas correctas
- Escalar a contingencia cuando el oficial insiste
- Generar documentos de impugnación

---

## 2. ARQUITECTURA ACTUAL

```
Frontend (React + Vite)
    ↓ HTTPS
Supabase Edge Function: legal-chat
    ├── Clasificador (clasificador.ts)
    │   └── GPT-4o: detecta tema, vehículo, método, hechos
    ├── Jurista (BASE_NORMATIVA en index.ts)
    │   └── Base de datos de normas por tema
    ├── Orquestador (index.ts)
    │   ├── detectarFase() → Determina fase 1, 2, 2b, 3, 4, cierre
    │   ├── ejecutarFase1() → Preguntas adaptativas
    │   ├── ejecutarFase2() → Guion de defensa
    │   ├── ejecutarFase2b() → Refutación o asesoría honesta
    │   ├── ejecutarFase3() → Escalación + Firma Bajo Protesta
    │   ├── ejecutarFase4() → Impugnación
    │   └── ejecutarFaseCierre() → Procedimiento resuelto
    └── Nodo Investigador (nodo2_investigador.ts)
        └── Búsqueda semántica en Supabase (actualmente no se usa)
    ↓
OpenAI GPT-4o API
```

---

## 3. BASE DE DATOS NORMATIVA (JURISTA)

Ubicación: `index.ts` - objeto `BASE_NORMATIVA`

Temas cubiertos:
- polarizados
- llantas
- casco (parrillero)
- cinturon
- cinturon_especial (Res. 668/2018)
- silla_nino (NTC 4481)
- semaforo
- luz_fundida
- kit_carretera
- placa
- escape
- velocidad
- piques
- embriaguez

Cada tema incluye:
- normas: string[]
- metodo_legal: string
- metodo_invalido: string
- codigo_infraccion?: string
- subsanable: boolean
- notas?: string
- preguntas_fase1: string[]

---

## 4. FLUJO DE FASES

### Fase 1: Triaje
- Entrada: Primer mensaje del usuario
- Proceso: Clasificar tema → Seleccionar preguntas del Jurista
- Salida: Saludo fijo + 3-4 preguntas específicas del tema

### Fase 2: Defensa
- Entrada: Respuestas del usuario a las preguntas
- Proceso: Generar guion con normas del Jurista
- Salida: "Dígale exactamente esto al oficial..." + guion + pregunta cierre

### Fase 2b: Refutación o Asesoría Honesta
- Entrada: Usuario reporta afirmación del oficial O Modo B detectado
- Proceso: 
  - Si afirmación incorrecta: refutar con normas
  - Si falta real: asesoría honesta sobre consecuencias
- Salida: Guion de refutación o asesoría directa

### Fase 3: Escalación
- Entrada: Oficial insiste en proceder
- Proceso: Generar guion escalado + descripción irregularidad
- Salida: Guion firme + Firma Bajo Protesta + instrucciones prácticas

### Fase 4: Impugnación
- Entrada: Usuario dice "sí" a pregunta de impugnación
- Proceso: Generar documento de impugnación completo
- Salida: Documento con hechos, fundamentos, pruebas, solicitudes

### Fase Cierre
- Entrada: Oficial cedió/aceptó/retiró procedimiento
- Proceso: Detectar éxito y dar mensaje de cierre
- Salida: Confirmación de éxito + recomendaciones finales

---

## 5. PROBLEMAS IDENTIFICADOS

### Problema 1: Preguntas no adaptativas
**Síntoma:** Para casco, preguntaba cosas irrelevantes (mayor/menor de edad, equipo técnico)
**Causa:** GPT-4o generando preguntas genéricas
**Solución intentada:** Preguntas fijas en BASE_NORMATIVA
**Estado:** Parcialmente resuelto, pero vuelve el sistema rígido

### Problema 2: Normas incorrectas
**Síntoma:** Citaba Resolución 668/2018 para polarizados (es para cinturones)
**Causa:** GPT-4o alucinando normas
**Solución intentada:** Base de datos normativa con restricción estricta en prompts
**Estado:** Necesita validación más robusta

### Problema 3: Falta de razonamiento
**Síntoma:** Salta directo al guión sin análisis previo
**Causa:** Diseño actual va directo a la acción
**Solución requerida:** Agregar paso de razonamiento jurídico antes del guión

### Problema 4: Repetición de Fase 3
**Síntoma:** Cuando oficial cedía, repetía escalación en vez de cerrar
**Causa:** No detectaba resolución favorable
**Solución implementada:** Fase "cierre" con regex de detección
**Estado:** Implementado, necesita pruebas

---

## 6. REQUERIMIENTOS DEL SISTEMA IDEAL

### Funcionales
1. **Clasificación inteligente:** Detectar tema, vehículo, método, contexto
2. **Razonamiento jurídico:** Analizar caso antes de dar solución
3. **Normas siempre correctas:** Nunca inventar normas
4. **Adaptatividad real:** Preguntas y respuestas según caso específico
5. **Memoria de conversación:** Mantener contexto durante todo el flujo
6. **Detección de éxito:** Saber cuándo el procedimiento se resolvió

### No funcionales
1. **Precisión legal 100%:** Las normas deben ser correctas siempre
2. **Tiempo de respuesta < 3 segundos**
3. **Escalable a miles de usuarios concurrentes**
4. **Costo controlado:** Optimizar llamadas a GPT-4o

---

## 7. ARCHIVOS CLAVE

```
supabase/functions/legal-chat/
├── index.ts              # Orquestador principal (V19)
├── types.ts              # Tipos TypeScript
├── clasificador.ts       # Clasificación de consultas
├── generador_guion.ts    # Generación de guiones (actualmente no se usa)
├── generador_impugnacion.ts  # Generación de impugnaciones
├── esqueletos.ts         # Templates y preguntas hardcodeadas
└── agentes/
    ├── nodo2_investigador.ts   # Búsqueda en Supabase
    └── ejemplos_entrenamiento.ts   # 10 ejemplos de casos
```

---

## 8. VARIABLES DE ENTORNO REQUERIDAS

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 9. DEPLOYMENT

```bash
cd supabase
npx supabase functions deploy legal-chat --no-verify-jwt
```

URL: `https://[PROJECT_ID].supabase.co/functions/v1/legal-chat`

---

## 10. PRÓXIMOS PASOS RECOMENDADOS

### Opción A: Mejorar sistema actual
1. Implementar validación de normas post-generación
2. Agregar paso de razonamiento antes de cada guión
3. Mejorar clasificador con más contexto
4. Testing exhaustivo con casos reales

### Opción B: GPT Personalizado de OpenAI
1. Crear GPT con conocimiento de normativa colombiana
2. Configurar actions para llamadas desde la app
3. Simplificar backend a solo proxy/validación

### Opción C: Reescritura completa
1. Diseñar arquitectura de agentes especializados
2. Implementar sistema de memoria y contexto
3. Crear pipeline de validación de normas
4. Testing con dataset de casos reales

---

## 11. CONTACTO Y CONTEXTO

**Usuario:** Desarrollador de HIVE-LAW  
**Frustración acumulada:** Múltiples iteraciones sin resultado satisfactorio  
**Necesidad:** Sistema que realmente razone como jurista experto  
**Presupuesto:** Limitado, pero dispuesto a invertir en solución profesional  
**Timeline:** Urgente, app necesita funcionar para usuarios reales

---

**Documento creado:** 2026-04-29  
**Versión:** 1.0  
**Próxima revisión:** Al asignar desarrollador experto
