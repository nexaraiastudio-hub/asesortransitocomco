
-- Table to link cases, norms, and situations for knowledge discovery
CREATE TABLE IF NOT EXISTS knowledge_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caso_id UUID REFERENCES casos_exitosos(id) ON DELETE CASCADE,
    norma_tema TEXT, -- references BASE_NORMATIVA keys
    situaciÃ³n_tipo TEXT, -- e.g., 'choque', 'multa_velocidad', 'documentos'
    vehÃ­culo_tipo TEXT,
    autoridad_tipo TEXT,
    ciudad TEXT,
    fuerza_asociacion FLOAT DEFAULT 1.0,
    creada_en TIMESTAMPTZ DEFAULT NOW(),
    actualizada_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_links_norma ON knowledge_links(norma_tema);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_situacion ON knowledge_links(situaciÃ³n_tipo);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_vehiculo ON knowledge_links(vehÃ­culo_tipo);
