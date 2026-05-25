-- Tabla para almacenar normas de tránsito de Colombia
CREATE TABLE IF NOT EXISTS normas_transito (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Identificación de la norma
    identificador TEXT NOT NULL UNIQUE, -- Ej: "Resolución 3777 de 2003"
    tipo TEXT NOT NULL CHECK (tipo IN ('resolucion', 'circular', 'ley', 'decreto', 'norma_tecnica')),
    entidad TEXT NOT NULL, -- Ej: "Ministerio de Transporte", "SecMovilidad Bogotá"
    
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
    
    -- Metadatos para búsqueda
    palabras_clave TEXT[],
    
    -- Tracking
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registrado_por TEXT DEFAULT 'tracker_autonomo'
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_normas_identificador ON normas_transito(identificador);
CREATE INDEX IF NOT EXISTS idx_normas_tipo ON normas_transito(tipo);
CREATE INDEX IF NOT EXISTS idx_normas_entidad ON normas_transito(entidad);
CREATE INDEX IF NOT EXISTS idx_normas_estado ON normas_transito(estado);
CREATE INDEX IF NOT EXISTS idx_normas_fecha_emision ON normas_transito(fecha_emision);

-- Índice GIN para búsqueda en palabras clave
CREATE INDEX IF NOT EXISTS idx_normas_palabras_clave ON normas_transito USING GIN(palabras_clave);

-- Políticas RLS
ALTER TABLE normas_transito ENABLE ROW LEVEL SECURITY;

-- Lectura pública para usuarios autenticados
CREATE POLICY "Normas visibles para usuarios autenticados" 
ON normas_transito FOR SELECT 
TO authenticated 
USING (true);

-- Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "Solo admins pueden gestionar normas" 
ON normas_transito FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Insertar normas existentes de la base_normativa.ts
INSERT INTO normas_transito (identificador, tipo, entidad, titulo, resumen, fecha_emision, palabras_clave)
VALUES 
    ('Resolución 3027 de 2010', 'resolucion', 'Ministerio de Transporte', 'Labrado mínimo de llantas', 'Establece el labrado mínimo de 1.6 mm para llantas de vehículos automotores', '2010-01-01', ARRAY['llantas', 'labrado', 'neumáticos']),
    ('NTC 5375', 'norma_tecnica', 'ICONTEC', 'Neumáticos para vehículos', 'Especificaciones técnicas para neumáticos', '2010-01-01', ARRAY['llantas', 'neumáticos', 'especificaciones']),
    ('Resolución 3777 de 2003', 'resolucion', 'Ministerio de Transporte', 'Polarizados', 'Regula el uso de polarizados en vehículos', '2003-01-01', ARRAY['polarizados', 'vidrios', 'transmisión luz']),
    ('Resolución 3443 de 2008', 'resolucion', 'Ministerio de Transporte', 'Transporte escolar', 'Regula el transporte escolar y sus condiciones técnicas', '2008-01-01', ARRAY['transporte escolar', 'escolar', 'menores']),
    ('Resolución 910 de 2008', 'resolucion', 'Ministerio de Transporte', 'Emisiones contaminantes', 'Control de emisiones contaminantes', '2008-01-01', ARRAY['emisiones', 'gases', 'contaminación']),
    ('NTC 4231', 'norma_tecnica', 'ICONTEC', 'Emisiones vehiculares', 'Métodos de medición de emisiones', '2008-01-01', ARRAY['emisiones', 'gases', 'medición']),
    ('Resolución 1844 de 2015', 'resolucion', 'Ministerio de Transporte', 'Alcoholemia', 'Control de alcoholemia', '2015-01-01', ARRAY['alcoholemia', 'alcohol', 'embriaguez']),
    ('Ley 1696 de 2013', 'ley', 'Congreso de Colombia', 'Ley de alcoholemia', 'Ley antialcoholemia', '2013-01-01', ARRAY['alcoholemia', 'alcohol', 'ley'])
ON CONFLICT (identificador) DO NOTHING;
