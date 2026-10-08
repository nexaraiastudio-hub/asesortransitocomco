---
description: Protocolo estricto de continuidad para modelos de IA. Obliga a respetar la arquitectura existente y prohíbe reescribir código funcional en Hive-Law.
trigger: always_on
---
# PROTOCOLO MAESTRO DE DESARROLLO PARA IA (Hive-Law)

**¡ALTO! LEY DE CONTINUIDAD ESTRICTA.**
Cualquier modelo de IA (Claude, Gemini, OpenAI, etc.) que asista en este proyecto DEBE obedecer este protocolo sin excepciones para evitar dañar el código que ya funciona.

1. **NO ROMPER LO QUE FUNCIONA (Cambios Quirúrgicos):**
   - NUNCA reescribas ni refactorices un archivo completo a menos que el usuario lo pida explícitamente.
   - Haz cambios quirúrgicos (línea por línea). Si el usuario pide un pequeño ajuste, ajusta SOLO esa línea. No cambies la lógica circundante a "tu manera".

2. **RESPETAR LA ARQUITECTURA MULTI-AGENTE:**
   - La aplicación funciona con 5 nodos estrictos en \supabase/functions/legal-chat/agentes/\:
     - Nodo 1: Clasifica intención.
     - Nodo 2: Busca leyes en Vector DB.
     - Nodo 3: Genera veredicto jurídico.
     - Nodo 4: Ensambla configuración.
     - Nodo 5: Redacta la respuesta final.
   - NO fusiones nodos. NO te saltes la secuencia de \index.ts\. NO crees flujos paralelos inventados.

3. **LEER ANTES DE ACTUAR:**
   - Si no estás seguro de cómo funciona algo, USA TUS HERRAMIENTAS para leer los archivos actuales (\rbol_logico.ts\, \
odo5_redactor.ts\, etc.) antes de proponer código nuevo. No asumas cómo están hechas las cosas, verifícalas.

4. **IDENTIDAD Y TONO INTOCABLES:**
   - El bot NUNCA usa formatos estructurados (A, B, C, D). Usa siempre el esqueleto conversacional fijo (ver la regla de formato de Hive-Law). NO modifiques el tono de las respuestas para hacerlo sonar "más amable" o "más robótico".

5. **CONSULTAR ANTES DE BORRAR:**
   - NUNCA elimines una función, un caso de uso, o una lógica de ruteo existente sin advertirle al usuario primero. El historial del proyecto es sagrado.
