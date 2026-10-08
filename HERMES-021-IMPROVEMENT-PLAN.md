# Plan de Mejoras con Hermes Agent 0.21

Proyecto: asesortransitocomco_app
Hermes Version: 0.21.1
Fecha: 2026-09-02

## 1. Code Review del legal-chat function [HIGH]
**Skill:** code-review-quality
**Target:** supabase/functions/legal-chat/index.ts

**Acciones:**
- Revisar arquitectura modular (agentes/nodos)
- Verificar naming y legibilidad
- Identificar deuda técnica y duplicación
- Verificar manejo de errores
- Revisar complejidad ciclomática

## 2. Suite de regresión para flujo de fases [HIGH]
**Skill:** regression-testing
**Target:** tests/regression/

**Acciones:**
- Crear tests para Fase 1 (saludo único)
- Crear tests para Fase 2/2b (sin saludo + contenido defensa)
- Crear tests para Fase 3 y 4
- Test de API key válida vs inválida
- Test de autenticación admin vs usuario normal

## 3. Mejoras al Frontend Vite/React [MEDIUM]
**Skill:** web-app-builder
**Target:** src/

**Acciones:**
- Verificar arquitectura de componentes
- Mejorar manejo de estado (historial de chat)
- Optimizar llamadas a API (debounce, retry)
- Añadir TypeScript types estrictos
- Mejorar UI/UX (loading states, error handling)

## 4. Documentación de troubleshooting [MEDIUM]
**Skill:** supabase-edge-runtime
**Target:** docs/troubleshooting.md

**Acciones:**
- Documentar solución de BOOT_ERROR
- Incluir comandos de diagnóstico
- Documentar secrets management
- Añadir checklist de deploy

## 5. Alinear app con mejores prácticas del skill [HIGH]
**Skill:** colombian-transit-normative-chatbot-development
**Target:** supabase/functions/legal-chat/

**Acciones:**
- Verificar formato saludo exacto: ((Saludos. Soy tu Abogado Asesor Élite en Tránsito y Transporte.))
- Verificar cierre normativo: ¿Algo más en que pueda colaborarte?
- Eliminar referencias a policías/agentes en modo normativa
- Implementar formulario 3 opciones post-login
- Validar modo normativa vs situacional

## 6. Crear skill reutilizable del workflow actual [MEDIUM]
**Skill:** workflow-skill-creator
**Target:** .hermes/skills/asesortransito-workflow/

**Acciones:**
- Brainstorming: documentar workflow completo
- Identificar pasos estrictos vs flexibles
- Definir entradas/salidas
- Crear SKILL.md con frontmatter
- Añadir scripts de deploy/sync

## 7. Skill específico para esta app [LOW]
**Skill:** web-app-skill-creator
**Target:** .hermes/skills/asesortransito-app/

**Acciones:**
- Definir scope: chat legal transit colombia
- Crear templates para components, hooks, types
- Definir puntos de integración (auth, supabase, openai)
- Documentar convenciones del proyecto

