# BRIEF TÉCNICO - CONTRATACIÓN EXPERTO
## Proyecto: HIVE-LAW (Sistema de Asesoría Legal en Tránsito)

---

## 1. RESUMEN EJECUTIVO

**Empresa:** HIVE-LAW  
**Proyecto:** App de asesoría legal en tránsito para Colombia  
**Estado actual:** 70% completado, requiere refinamiento de lógica de razonamiento  
**Presupuesto estimado:** $2,000 - $5,000 USD  
**Tiempo estimado:** 2-3 semanas  
**Modalidad:** Freelance remoto o agencia

---

## 2. DESCRIPCIÓN DEL PROBLEMA

Se ha desarrollado un sistema de asesoría legal en tránsito usando:
- Supabase Edge Functions (Deno/TypeScript)
- OpenAI GPT-4o
- Arquitectura de orquestador con fases

**El problema:** El sistema no razona adecuadamente como un jurista experto. Específicamente:

1. **No adapta preguntas** al caso específico (preguntas genéricas o irrelevantes)
2. **Alucina normas** (cita normas inexistentes o incorrectas para el tema)
3. **No razona** antes de dar solución (salta directo al guión legal)
4. **No detecta** cuando el procedimiento se resolvió favorablemente

---

## 3. OBJETIVOS DEL PROYECTO

### Objetivo Principal
Crear un sistema que razone como un jurista experto en tránsito colombiano, adaptándose a cada caso específico del usuario.

### Objetivos Específicos
1. Implementar clasificación inteligente de casos
2. Generar preguntas adaptativas relevantes al contexto
3. Garantizar citación 100% correcta de normas legales
4. Agregar paso de razonamiento jurídico antes de soluciones
5. Detectar resolución favorable y dar cierre apropiado

---

## 4. REQUERIMIENTOS TÉCNICOS

### Stack Tecnológico (obligatorio)
- **Backend:** Supabase Edge Functions (Deno/TypeScript)
- **IA:** OpenAI GPT-4o (API)
- **Base de datos:** Supabase PostgreSQL (para embeddings si aplica)
- **Versionado:** Git

### Funcionalidades Requeridas

#### 4.1 Clasificación Inteligente
```
Input: "Me detuvieron por llevar una persona sin casco en la moto"
Output: {
  tema: "casco",
  subtipo: "parrillero_sin_casco",
  vehiculo: "motocicleta",
  servicio: "particular",
  metodo_control: "observacion_directa",
  contexto: {ciudad: null, hora: null}
}
```

#### 4.2 Preguntas Adaptativas
- No preguntar "¿usó equipo técnico?" si es falta objetiva visible
- No preguntar "¿mayor de edad?" si es irrelevante para la defensa
- Preguntar solo lo necesario para armar la defensa legal

#### 4.3 Normas Siempre Correctas
- Validar que las normas citadas existan y apliquen al tema
- Ejemplo: Para polarizados → Resolución 3777/2003, NO Resolución 668/2018

#### 4.4 Razonamiento Jurídico
Antes de dar el guión, el sistema debe mostrar (o generar internamente) un análisis:
```
"El usuario lleva parrillero sin casco. Según Art. 94 y 96 Ley 769/2002, 
esto es infracción C.02. Sin embargo, según Art. 125, si el parrillero 
desciende, la falta queda subsanada y no procede inmovilización."
```

#### 4.5 Flujo Completo
Ver archivo `DOCUMENTACION_TECNICA_HIVE_LAW.md` sección 4.

---

## 5. ENTREGABLES ESPERADOS

### Código
1. `index.ts` refactorizado con lógica de razonamiento
2. Sistema de validación de normas post-generación
3. Tests unitarios para cada fase
4. Dataset de prueba con 20 casos reales

### Documentación
1. Guía de arquitectura del sistema
2. Manual de normas aplicables por tema
3. Instrucciones de deployment
4. Documentación de API

### Training
1. Sesión de handover (2 horas)
2. Explicación de decisiones técnicas
3. Guía de mantenimiento

---

## 6. CRITERIOS DE ACEPTACIÓN

### Funcionales
- [ ] Sistema clasifica correctamente 95% de casos de prueba
- [ ] Nunca cita normas inexistentes (0% tolerancia)
- [ ] Preguntas son relevantes al caso específico
- [ ] Detecta resolución favorable y da cierre apropiado
- [ ] Tiempo de respuesta < 3 segundos

### Testing
- [ ] 20 casos de prueba documentados y pasando
- [ ] Tests unitarios para cada función crítica
- [ ] Validación de normas automatizada

---

## 7. PERFIL DEL CANDIDATO IDEAL

### Hard Skills (obligatorios)
- ✅ 5+ años experiencia en desarrollo backend
- ✅ Experiencia con TypeScript/Deno/Node.js
- ✅ Experiencia con OpenAI API / LLMs
- ✅ Conocimiento de arquitecturas de agentes de IA
- ✅ Experiencia con Supabase o Firebase

### Hard Skills (deseables)
- ⭐ Conocimiento de derecho de tránsito colombiano
- ⭐ Experiencia con sistemas de RAG (Retrieval Augmented Generation)
- ⭐ Experiencia con prompt engineering avanzado
- ⭐ Conocimiento de embeddings y búsqueda semántica

### Soft Skills
- Capacidad de explicar decisiones técnicas
- Orientado a resultados (no solo a escribir código)
- Proactivo en proponer soluciones
- Disponible para reuniones de seguimiento

---

## 8. PROPUESTA DE TRABAJO

### Fase 1: Análisis (3 días)
- Revisar código actual
- Entender casos de uso
- Diseñar arquitectura mejorada
- **Entregable:** Documento de diseño técnico

### Fase 2: Implementación (10 días)
- Refactorizar sistema
- Implementar validaciones
- Crear tests
- **Entregable:** Código funcional

### Fase 3: Testing (4 días)
- Testing con casos reales
- Ajustes finales
- Documentación
- **Entregable:** Sistema probado y documentado

### Total: 17 días hábiles (~3 semanas)

---

## 9. PAGO

### Opción A: Por hitos
- 30% al inicio
- 40% al finalizar Fase 2
- 30% al aceptar entregables finales

### Opción B: Por hora
- Tarifa horaria acordada
- Reporte semanal de horas
- Pago quincenal

---

## 10. CONTACTO PARA POSTULACIONES

**Email:** [por definir por el cliente]  
**Asunto:** "Propuesta HIVE-LAW - [Tu nombre]"  
**Incluir:**
1. CV o LinkedIn
2. Portafolio de proyectos similares
3. Propuesta técnica inicial (máx 1 página)
4. Disponibilidad y tarifa

---

## 11. MATERIALES ADJUNTOS

1. `DOCUMENTACION_TECNICA_HIVE_LAW.md` - Documentación completa
2. Repositorio GitHub (acceso bajo NDA)
3. Casos de prueba (20 ejemplos)

---

**Fecha de publicación:** 2026-04-29  
**Fecha límite de postulación:** [definir]  
**Fecha estimada de inicio:** [definir]

---

## NOTAS PARA EL CONTRATANTE

Este proyecto ha tenido múltiples iteraciones sin éxito. Se requiere un profesional que:
- Entienda el problema a fondo antes de proponer soluciones
- Tenga experiencia demostrable con sistemas de IA/LLMs
- Pueda trabajar con código existente (no desde cero)
- Comunique claramente el enfoque técnico antes de implementar

La prioridad es **calidad sobre velocidad**. Prefiero 3 semanas con resultado profesional a 1 semana con parches.
