-- Tabla para almacenar normas de trÃ¡nsito de Colombia
CREATE TABLE IF NOT EXISTS normas_transito (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- IdentificaciÃ³n de la norma
    identificador TEXT NOT NULL UNIQUE, -- Ej: "ResoluciÃ³n 3777 de 2003"
    tipo TEXT NOT NULL CHECK (tipo IN ('resolucion', 'circular', 'ley', 'decreto', 'norma_tecnica')),
    entidad TEXT NOT NULL, -- Ej: "Ministerio de Transporte", "SecMovilidad BogotÃ¡"
    
    -- Contenido
    titulo TEXT,
    resumen TEXT,
    fecha_emision DATE,
    fecha_publicacion DATE,
    
    -- Enlaces y fuentes
    url_fuente TEXT,
    url_pdf TEXT,
    
    -- Estado
    estado TEXT DEFAULT 'vigente' CHECK (estado IN ('vigente', 'derogada', 'modificada')),
    
    -- Metadatos para bÃºsqueda
    palabras_clave TEXT[],
    
    -- Tracking
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registrado_por TEXT DEFAULT 'tracker_autonomo'
);

-- Ãndices para bÃºsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_normas_identificador ON normas_transito(identificador);
CREATE INDEX IF NOT EXISTS idx_normas_tipo ON normas_transito(tipo);
CREATE INDEX IF NOT EXISTS idx_normas_entidad ON normas_transito(entidad);
CREATE INDEX IF NOT EXISTS idx_normas_estado ON normas_transito(estado);
CREATE INDEX IF NOT EXISTS idx_normas_fecha_emision ON normas_transito(fecha_emision);

-- Ãndice GIN para bÃºsqueda en palabras clave
CREATE INDEX IF NOT EXISTS idx_normas_palabras_clave ON normas_transito USING GIN(palabras_clave);

-- PolÃ­ticas RLS
ALTER TABLE normas_transito ENABLE ROW LEVEL SECURITY;

-- Lectura pÃºblica para usuarios autenticados
CREATE POLICY "Normas visibles para usuarios autenticados" 
ON normas_transito FOR SELECT 
TO authenticated 
USING (true);



-- Insertar normas existentes de la base_normativa.ts
INSERT INTO normas_transito (identificador, tipo, entidad, titulo, resumen, fecha_emision, palabras_clave)
VALUES 
    ('ResoluciÃ³n 3027 de 2010', 'resolucion', 'Ministerio de Transporte', 'Labrado mÃ­nimo de llantas', 'Establece el labrado mÃ­nimo de 1.6 mm para llantas de vehÃ­culos automotores', '2010-01-01', ARRAY['llantas', 'labrado', 'neumÃ¡ticos']),
    ('NTC 5375', 'norma_tecnica', 'ICONTEC', 'NeumÃ¡ticos para vehÃ­culos', 'Especificaciones tÃ©cnicas para neumÃ¡ticos', '2010-01-01', ARRAY['llantas', 'neumÃ¡ticos', 'especificaciones']),
    ('ResoluciÃ³n 3777 de 2003', 'resolucion', 'Ministerio de Transporte', 'Polarizados', 'Regula el uso de polarizados en vehÃ­culos', '2003-01-01', ARRAY['polarizados', 'vidrios', 'transmisiÃ³n luz']),
    ('ResoluciÃ³n 3443 de 2008', 'resolucion', 'Ministerio de Transporte', 'Transporte escolar', 'Regula el transporte escolar y sus condiciones tÃ©cnicas', '2008-01-01', ARRAY['transporte escolar', 'escolar', 'menores']),
    ('ResoluciÃ³n 910 de 2008', 'resolucion', 'Ministerio de Transporte', 'Emisiones contaminantes', 'Control de emisiones contaminantes', '2008-01-01', ARRAY['emisiones', 'gases', 'contaminaciÃ³n']),
    ('NTC 4231', 'norma_tecnica', 'ICONTEC', 'Emisiones vehiculares', 'MÃ©todos de mediciÃ³n de emisiones', '2008-01-01', ARRAY['emisiones', 'gases', 'mediciÃ³n']),
    ('ResoluciÃ³n 1844 de 2015', 'resolucion', 'Ministerio de Transporte', 'Alcoholemia', 'Control de alcoholemia', '2015-01-01', ARRAY['alcoholemia', 'alcohol', 'embriaguez']),
    ('Ley 1696 de 2013', 'ley', 'Congreso de Colombia', 'Ley de alcoholemia', 'Ley antialcoholemia', '2013-01-01', ARRAY['alcoholemia', 'alcohol', 'ley'])
ON CONFLICT (identificador) DO NOTHING;
