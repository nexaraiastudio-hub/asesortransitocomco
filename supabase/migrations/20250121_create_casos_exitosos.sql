-- Tabla para almacenar casos exitosos de aprendizaje continuo
CREATE TABLE IF NOT EXISTS casos_exitosos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- ClasificaciÃ³n del caso
    tema TEXT NOT NULL,
    arquetipo TEXT NOT NULL CHECK (arquetipo IN ('ABUSO', 'FALTA_INMOVILIZACION_ILEGAL', 'OFICIAL_CORRECTO')),
    
    -- Fase 1: Triaje
    fase1_usuario TEXT NOT NULL,
    fase1_respuesta TEXT NOT NULL,
    
    -- Fase 2: Defensa
    fase2_usuario TEXT NOT NULL,
    fase2_respuesta TEXT NOT NULL,
    
    -- Fase 2b: RefutaciÃ³n (opcional)
    fase2b_usuario TEXT,
    fase2b_respuesta TEXT,
    
    -- Fase 3: Contingencia (opcional)
    fase3_usuario TEXT,
    fase3_respuesta TEXT,
    
    -- Metadatos del aprendizaje
    argumento_decisivo TEXT NOT NULL,
    resultado TEXT NOT NULL,
    fase_resolucion TEXT NOT NULL,
    
    -- Estado y uso
    aprobado BOOLEAN DEFAULT FALSE,
    usos INTEGER DEFAULT 0
);

-- Ãndices para bÃºsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_casos_tema ON casos_exitosos(tema);
CREATE INDEX IF NOT EXISTS idx_casos_arquetipo ON casos_exitosos(arquetipo);
CREATE INDEX IF NOT EXISTS idx_casos_aprobado ON casos_exitosos(aprobado);
CREATE INDEX IF NOT EXISTS idx_casos_usos ON casos_exitosos(usos DESC);

-- PolÃ­ticas RLS para seguridad
ALTER TABLE casos_exitosos ENABLE ROW LEVEL SECURITY;

-- Solo lectura para usuarios autenticados
CREATE POLICY "Casos exitosos visibles para usuarios autenticados" 
ON casos_exitosos FOR SELECT 
TO authenticated 
USING (aprobado = TRUE);



-- FunciÃ³n para incrementar contador de usos
CREATE OR REPLACE FUNCTION increment_usos(row_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_usos INTEGER;
BEGIN
    SELECT usos INTO current_usos FROM casos_exitosos WHERE id = row_id;
    RETURN COALESCE(current_usos, 0) + 1;
END;
$$ LANGUAGE plpgsql;
