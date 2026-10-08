-- Create match_legal_documents function for vector similarity search
-- This function is used by nodo2_Investigador to find relevant legal documents

-- First, ensure the pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create legal_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo text NOT NULL,
    content text NOT NULL,
    embedding vector(1536),
    tema text,
    created_at timestamptz DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS legal_documents_embedding_idx 
    ON public.legal_documents USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read
CREATE POLICY "Legal documents are readable by authenticated users" 
    ON public.legal_documents FOR SELECT 
    TO authenticated 
    USING (true);

-- Policy for service role to manage
CREATE POLICY "Service role can manage legal documents" 
    ON public.legal_documents FOR ALL 
    TO service_role 
    USING (true);

-- Create the match_legal_documents function
CREATE OR REPLACE FUNCTION public.match_legal_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    titulo text,
    content text,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT 
        ld.id,
        ld.titulo,
        ld.content,
        1 - (ld.embedding <=> query_embedding) AS similarity
    FROM legal_documents ld
    WHERE 1 - (ld.embedding <=> query_embedding) > match_threshold
    ORDER BY ld.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.match_legal_documents(vector, float, int) TO authenticated, service_role;
