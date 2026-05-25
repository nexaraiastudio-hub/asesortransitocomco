# CONTEXTO OPERATIVO: ABOGADO ASESOR ELITE — V15.2

Este documento resume la arquitectura actual del agente de IA para la aplicacion Asesor de Transito.

## Arquitectura V15.2 — Esqueleto Adaptativo Universal

### Pipeline de 5 Nodos
El backend opera mediante un pipeline secuencial de 5 nodos en Supabase Edge Functions:

1. **Nodo 1 — Analista de Triaje:** Clasifica la consulta (15 tipos de caso), determina fase (1-4) y modo (A/B).
2. **Nodo 2 — Investigador:** Busqueda semantica (embeddings) en la base de datos legal de Supabase.
3. **Nodo 3 — Jurista Universal:** Emite veredicto legal con patron defensivo (1-6), modo (A/B), argumento tecnico y cita normativa.
4. **Nodo 4 — Ensamblador:** Selecciona el esqueleto de respuesta segun fase y modo. Prepara datos dinamicos.
5. **Nodo 5 — Redactor:** Genera la respuesta final usando system prompt V15.2 + plantilla + veredicto.

### Flujo de 4 Fases (V15.2)
```
[ENTRADA] -> TRIAJE -> ANALISIS + GUION -> CONTINGENCIA -> IMPUGNACION -> [FIN]
```
- **Fase 1 — Triaje:** Diagnostico y recoleccion de datos. Si faltan datos, DETENTE y pregunta.
- **Fase 2 — Analisis + Guion de Voz:** Razonamiento juridico + texto exacto para decirle al oficial.
- **Fase 3 — Contingencia:** Escalamiento si el oficial persiste. Firma Bajo Protesta.
- **Fase 4 — Impugnacion:** Documento formal de impugnacion. Solo si el usuario lo solicita.

### Doble Modo de Operacion
- **MODO A — Defensa Agresiva:** El oficial NO tiene razon o su procedimiento tiene vicios.
- **MODO B — Asesoria Honesta:** El oficial SI tiene razon total o parcial. Falta real y demostrable.

### 6 Patrones de Logica Defensiva
1. Falta de Equipo Tecnico (MODO A)
2. Falta Real del Usuario (MODO B)
3. Falta Sin Prueba (MODO A)
4. Irregularidades en el Procedimiento (MODO A)
5. Subsanacion Negada (MODO A para inmovilizacion)
6. Falta Mixta (MODO B + MODO A)

### Matriz Legal: 15 Tipos de Caso
| Caso | Normativa Principal | Equipo Requerido |
|---|---|---|
| Llantas | Res. 3027/2010 + NTC 5375 | Profundimetro Calibrado |
| Polarizados | Res. 3777/2003 | Fotometro/Luxometro |
| Emisiones | Res. 910/2008 + NTC 4231 | Analizador gases/Opacimetro |
| Transporte escolar | Res. 3443/2008 | Segun infraccion |
| Embriaguez | Ley 1696/2013 + Res. 1844/2015 | Alcohosensor certificado |
| Casco | Ley 769/2002 Art. 94 | Visual (falta objetiva) |
| Semaforo | Ley 769/2002 Art. 131 | Camara/video |
| Luz fundida | Res. 3027/2010 | Visual |
| SOAT vencido | Ley 769/2002 Art. 42 | Consulta RUNT |
| Licencia | Ley 769/2002 Art. 26 | Consulta RUNT |
| RTM vencida | Ley 769/2002 Art. 51 | Consulta RUNT |
| Parqueo prohibido | Ley 769/2002 Art. 76 | Senalizacion visible |
| Exceso velocidad | Ley 769/2002 Art. 131 | Radar/cinemometro |
| Casco conductor | Ley 769/2002 Art. 94 | Visual |
| Chaleco reflectivo | Ley 769/2002 Art. 94 | Visual |

## Principios Legales Transversales
1. Art. 29 CP: Debido Proceso y Presuncion de Inocencia.
2. Art. 125 Ley 769/2002: Subsanacion en sitio.
3. Art. 20 CP + Art. 21 Ley 1801/2016: Derecho a grabar.
4. Sentencia C-799/2003: Inmovilizacion = medida cautelar, cesa al subsanar.
5. Sentencia C-038/2020: Responsabilidad contravencional debe probarse.
6. Art. 416 Codigo Penal: Abuso de Autoridad.

## Contrato Frontend-Backend
- **Frontend envia:** `{ message: string, history: [{role, content}] }`
- **Backend responde:** `{ response: string }`
- El frontend (Chat.tsx) usa ReactMarkdown para renderizar las respuestas.

## Restricciones Criticas
- No mencionar nombres tecnicos internos (Nexara, Hive, Agentes).
- Tono: Profesional, tecnico, autoritario. Sin muletillas de chatbot.
- Bloques fijos (( )) son literales y obligatorios.
- Flujo secuencial: nunca saltar fases.
- Grabacion obligatoria en primera interaccion.
