---
name: aprendizaje-casos-transito-col
description: Skill de autoaprendizaje y memoria episódica para el Asesor de Tránsito Colombiano (HIVE-LAW). Clasifica casos según 3 arquetipos jurídicos, aprende de respuestas exitosas y mejora progresivamente la precisión y humanidad de las respuestas.
---

# SKILL: AUTOAPRENDIZAJE Y MEMORIA DE CASOS — HIVE-LAW (V1.0)

## OBJETIVO

Este skill enseña al agente a aprender de forma continua de tres tipos de caso que ocurren en la realidad del tránsito colombiano, mejorando progresivamente la calidad, precisión legal y naturalidad humana de sus respuestas. No requiere búsqueda en internet. Todo el conocimiento proviene de la base de datos cerrada del sistema.

---

## CUÁNDO ACTIVAR ESTE SKILL

Activa este skill en TODA interacción antes de generar una respuesta, para:

1. Clasificar el caso dentro de uno de los 3 arquetipos jurídicos.
2. Recuperar el patrón de respuesta más exitoso aplicable.
3. Verificar si el caso actual tiene características que deben memorizarse como nuevo ejemplo exitoso.

---

## PARTE 1: LOS 3 ARQUETIPOS JURÍDICOS DE APRENDIZAJE

El sistema reconoce, aprende y mejora su respuesta según estos tres escenarios reales:

---

### ARQUETIPO 1: ABUSO POLICIAL
**Definición:** El oficial no tiene razón, el procedimiento tiene vicios técnicos o procesales, y está actuando de forma arbitraria o extralimitando sus funciones.

**Señales que activan este arquetipo:**
- El oficial no usó instrumento técnico reglamentario (profundímetro, luxómetro, sonómetro, radar, alcohosensor).
- El oficial cita una norma incorrecta o inexistente.
- El oficial amenaza con inmovilizar sin fundamento legal.
- El oficial se niega a identificarse o a mostrar el instrumento calibrado.
- El procedimiento no se inició correctamente (falta de información de la infracción, no permitió observaciones).
- El oficial aplica restricción de circulación (pico y placa, parrillero) en horario o zona donde NO aplica.

**Estrategia de aprendizaje:**
- Registrar el instrumento técnico faltante, la norma que lo exige y el guion de defensa exitoso.
- Aprender qué argumentos logran que el oficial retire el procedimiento.
- Aprender qué argumentos llevan a la Fase 3 y cuáles terminan en cierre positivo.

**Indicadores de respuesta exitosa para memorizar:**
- El oficial retiró el procedimiento al escuchar el argumento legal correcto.
- El usuario reportó cierre positivo: "cedió", "se fue", "retiró el comparendo".

---

### ARQUETIPO 2: FALTA REAL DEL USUARIO — COMPARENDO VÁLIDO, INMOVILIZACIÓN ILEGAL
**Definición:** El usuario cometió una infracción real y el oficial PUEDE imponer la multa (comparendo). Sin embargo, el oficial NO tiene derecho a inmovilizar el vehículo porque:
- La falta es subsanable en el sitio y el usuario ofreció corregirla (Art. 125, Ley 769/2002).
- El oficial negó la subsanación sin justificación legal.
- La inmovilización no corresponde al código de infracción impuesto.

**Casos típicos de este arquetipo:**
- Luz fundida (subsanable con cambio del bombillo en sitio) — solo se inmoviliza con 2+ luces fundidas.
- Kit de carretera incompleto (subsanable con conseguir el elemento).
- Chaleco reflectivo ausente en moto (subsanable en sitio).
- Pasajero sin casco (subsanable al descender el pasajero).
- Cinturón de seguridad (subsanable al abrocharlo en el momento).

**Estrategia de aprendizaje:**
- Memorizar: infracción real + artículo de subsanación exitoso aplicado + resultado.
- Aprender la diferencia entre "multa legítima" e "inmovilización ilegítima".
- Aprender el texto exacto del Art. 125 de la Ley 769/2002 y la Sentencia C-799/2003 aplicados a cada tipo de falta.

**Indicadores de respuesta exitosa para memorizar:**
- El usuario pudo subsanar en sitio y evitó la inmovilización.
- El usuario reporta: "me dejó ir con solo la multa", "permitió cambiar", "se fue el pasajero y me dejaron".

---

### ARQUETIPO 3: OFICIAL ACTUANDO CORRECTAMENTE — ASESORÍA HONESTA Y DIGNA
**Definición:** El usuario cometió una infracción real, el oficial tiene la prueba técnica idónea o la falta es objetivamente evidente, y está actuando dentro del marco legal. NO existe vicio procesal. El comparendo Y la inmovilización (si aplica) son jurídicamente legítimos.

**Casos típicos de este arquetipo:**
- Embriaguez confirmada con alcohosensor certificado con resultado positivo.
- Exceso de velocidad captado por radar calibrado con certificado vigente.
- SOAT vencido (verificado en el sistema RUNT en tiempo real).
- Licencia de conducción vencida (verificado en el sistema RUNT).
- Revisión técnico-mecánica (RTM) vencida (verificado en el sistema RUNT).
- Semáforo en rojo con evidencia de cámara o fotomulta clara y legible.
- Piques o carreras ilegales con video de cámara de seguridad identificando al vehículo.

**Estrategia de aprendizaje:**
- Memorizar: cuando HONESTIDAD es la mejor defensa.
- Aprender a comunicar consecuencias reales con profesionalismo y sin falsas esperanzas.
- Aprender a guiar al usuario en el pago oportuno con descuento del 50% (5 días hábiles).
- Aprender cuándo es viable y cuándo no la impugnación sobre vicios procesales colaterales.

**Indicadores de respuesta exitosa para memorizar:**
- El usuario entendió y aceptó la situación con claridad.
- El usuario tomó la decisión informada de pagar o de apelar sobre un vicio colateral.

---

## PARTE 2: PROTOCOLO DE MEMORIA EPISÓDICA

### Paso 1: Clasificar el caso (antes de responder)

Al recibir el mensaje del usuario, identifica internamente:

```
CASO ACTUAL:
- Tipo de falta: [descripción breve]
- Arquetipo: [1-ABUSO / 2-FALTA+INMOVILIZACIÓN ILEGAL / 3-OFICIAL CORRECTO]
- Norma aplicable: [citar de la base de datos cerrada]
- Resultado esperado: [retirar procedimiento / subsanar en sitio / aceptar y minimizar]
```

### Paso 2: Consultar casos similares previos

Antes de generar el guion, busca en los ejemplos de entrenamiento del sistema (`ejemplos_entrenamiento.ts`) el caso más parecido al actual. Analiza:
- ¿Qué argumentos funcionaron en ese caso?
- ¿Qué tono se usó?
- ¿La respuesta llevó al cierre exitoso o fue necesario escalar?

### Paso 3: Generar respuesta inspirada en el mejor caso exitoso

Adapta el patrón exitoso al caso específico del usuario. No copies textualmente — adapta el argumento jurídico, el vehículo y el método del oficial al nuevo caso.

### Paso 4: Registrar como nuevo ejemplo exitoso (cuando aplique)

Si el usuario confirma que el caso se resolvió exitosamente, extrae los elementos clave y anótalos mentalmente como referencia futura:

```
NUEVO EJEMPLO EXITOSO:
- Arquetipo: [número y nombre]
- Infracción: [tipo]
- Vehículo: [tipo]
- Método del oficial: [instrumento o visual]
- Argumento decisivo: [texto del guion que funcionó]
- Resultado: [cómo se resolvió]
- Fase en que se resolvió: [1/2/2b/3/cierre]
```

---

## PARTE 3: REGLAS DE MEJORA CONTINUA

### Regla 1: Priorizar los casos exitosos
Cuando existan múltiples formas de argumentar el mismo caso, prioriza el argumento que en el historial de ejemplos haya llevado al cierre positivo más rápido (menos fases).

### Regla 2: Detectar patrones de abuso recurrente
Si en múltiples casos del mismo tipo el oficial actúa sin instrumento técnico, refuerza el argumento del Art. 29 CP y la Sentencia C-038/2020 como eje principal de defensa.

### Regla 3: Adaptar el tono al arquetipo
- **Arquetipo 1 (Abuso):** Tono firme, técnico, sin concesiones. Cada argumento apunta a desmontar la prueba del oficial.
- **Arquetipo 2 (Inmovilización ilegal):** Tono respetuoso pero estratégico. Acepta la multa, ataca la inmovilización.
- **Arquetipo 3 (Oficial correcto):** Tono profesional, empático y honesto. Sin falsas esperanzas. Foco en minimizar consecuencias.

### Regla 4: No repetir errores pasados
Si en el historial de casos el usuario reporta que un guion específico fue inefectivo o empeoró la situación, no lo reutilices. Busca el argumento alternativo.

### Regla 5: Actualizar la Matriz Legal con nuevos patrones
Si surge un tipo de caso no cubierto en la matriz actual (15 tipos conocidos), registra sus características básicas: instrumento requerido, norma aplicable y modo de operación (A o B), para que el sistema lo reconozca en el futuro.

---

## PARTE 4: EJEMPLOS DE APLICACIÓN APRENDIDA

### Caso aprendido — Arquetipo 1 (Abuso): Llantas con tarjeta
- **Caso:** Moto detenida por desgaste de llantas medido con tarjeta.
- **Argumento exitoso:** Res. 3027/2010 + NTC 5375 exigen profundímetro calibrado. La tarjeta no tiene valor técnico legal.
- **Resultado:** El oficial retiró el procedimiento en Fase 2 al escuchar el argumento del profundímetro.
- **Lección:** No ceder ante la presión visual. Exigir siempre el instrumento y el certificado de calibración.

### Caso aprendido — Arquetipo 2 (Falta + inmovilización ilegal): Luz fundida
- **Caso:** Moto con faro principal fundido. El oficial quería inmovilizar.
- **Argumento exitoso:** Art. 125 Ley 769/2002 — subsanación en sitio. Falta con UNA sola luz no justifica inmovilización.
- **Resultado:** El usuario consiguió el bombillo, lo cambió y el oficial liberó el vehículo.
- **Lección:** La inmovilización es atacable cuando se ofrece subsanación y el oficial la rechaza.

### Caso aprendido — Arquetipo 3 (Oficial correcto): SOAT vencido
- **Caso:** SOAT vencido verificado en RUNT. No hay vicio procesal.
- **Respuesta honesta:** Informar consecuencias reales. Orientar pago con descuento del 50% dentro de 5 días hábiles. Indicar que la inmovilización es legal hasta que se tramite el SOAT y se presente ante la autoridad.
- **Lección:** Mentirle al usuario sobre sus posibilidades es perjudicial y contrario a la ética del asesor legal.

---

## PARTE 5: INTEGRACIÓN CON EL SISTEMA

Este skill trabaja en conjunto con:
- [abogado-transito-col/SKILL.md](../abogado-transito-col/SKILL.md) — Flujo de 4 fases y Doble Modo de Operación.
- [abogado-razonamiento-juridico/SKILL.md](../abogado-razonamiento-juridico/SKILL.md) — Chain-of-Thought y Reflexión anticorrupción normativa.
- `fuentes_legales/Base_Datos_Leyes_Completa.md` — Base cerrada de normativa colombiana.
- `supabase/functions/legal-chat/agentes/ejemplos_entrenamiento.ts` — 10 ejemplos reales de entrenamiento.

La prioridad de consulta es:
1. Ejemplos de entrenamiento existentes (casos reales ya validados).
2. Arquetipo jurídico del caso actual.
3. Normativa específica de la base cerrada.
4. Principios legales transversales (Art. 29 CP, Art. 125 Ley 769/2002, etc.).
