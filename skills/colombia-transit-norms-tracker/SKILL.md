---
name: colombia-transit-norms-tracker
description: Busca de forma autónoma nuevas resoluciones y normas de tránsito en Colombia desde 2025, cruzándolas con Supabase para evitar duplicados.
---

# Colombia Transit Norms Tracker

**Objetivo:** Buscar en internet nuevas resoluciones, circulares y normativas emitidas por el Ministerio de Transporte, la Secretaría de Movilidad de Bogotá, ANSV y la SuperTransporte, a partir de una fecha específica, y verificar en la base de datos de la app si ya están registradas.

## Requisitos Previos

1. **Instalar dependencias:**
   ```bash
   pip install supabase
   ```

2. **Configurar archivo .env:**
   Crear archivo `C:\Users\WIN10\.gemini\antigravity\scratch\.env` con:
   ```
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_aqui
   SUPABASE_URL=https://rmuqhrfahzkxtjedjxip.supabase.co
   ```

3. **Crear tabla en Supabase:**
   Ejecutar el SQL en `supabase/migrations/20250122_create_normas_transito.sql`

## Instrucciones para el Agente

1. **Recuperar Fecha de Búsqueda:**
   - Lee el archivo `C:\Users\WIN10\.gemini\antigravity\scratch\last_search_date.txt`.
   - Si no existe, asume que la fecha de inicio es `2025-01-01`.

2. **Buscar Novedades:**
   - Utiliza la herramienta `search_web` para buscar: "nuevas resoluciones ministerio de transporte colombia 2025", "nuevas resoluciones secretaría de movilidad bogotá", etc.
   - Analiza los resultados buscando normas emitidas DESPUÉS de la fecha leída en el paso 1.

3. **Verificar y Guardar en Base de Datos (Supabase):**
   - Para cada norma o resolución relevante que encuentres, extrae un identificador único (ej: "Resolución 1234 de 2025").
   - Extrae también el Título y un Resumen completo.
   - Ejecuta el script `check_db.py` ubicado en la carpeta de este skill, pasándole TODOS los argumentos:
     ```bash
     python ./skills/colombia-transit-norms-tracker/check_db.py "IDENTIFICADOR" "C:\Users\WIN10\.gemini\antigravity\scratch\.env" "TITULO_DE_LA_NORMA" "CONTENIDO_Y_RESUMEN_COMPLETO" "ENTIDAD"
     ```

4. **Reportar Resultados:**
   - Si el script devuelve `NEW_INSERTED`, significa que la norma no existía y el script ya se encargó de generar su embedding y guardarla en la tabla `conocimiento_legal`.
   - Genera una alerta al usuario formateada en Markdown indicando lo que encontraste y confirmando que "Ya fue añadida a la base de conocimiento de la IA".
   - Si el script devuelve `EXISTS`, reporta que ya estaba en la base de datos.

5. **Actualizar Fecha de Búsqueda:**
   - Al finalizar exitosamente, sobrescribe `C:\Users\WIN10\.gemini\antigravity\scratch\last_search_date.txt` con la fecha actual en formato `YYYY-MM-DD`.
