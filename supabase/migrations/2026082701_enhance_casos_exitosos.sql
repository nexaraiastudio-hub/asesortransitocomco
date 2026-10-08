
-- Enhance casos_exitosos table for second brain
ALTER TABLE casos_exitosos 
ADD COLUMN IF NOT EXISTS tema_legal TEXT,
ADD COLUMN IF NOT EXISTS hechos_clave JSONB,
ADD COLUMN IF NOT EXISTS normas_aplicadas TEXT[],
ADD COLUMN IF NOT EXISTS resultado_clave TEXT,
ADD COLUMN IF NOT EXISTS vector_embedding VECTOR(1536),
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_casos_exitosos_tema ON casos_exitosos(tema_legal);
CREATE INDEX IF NOT EXISTS idx_casos_exitosos_tags ON casos_exitosos USING GIN(tags);
