-- COPIA TODO ESTO Y PÉGALO EN EL SQL EDITOR DE SUPABASE --

create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  titulo text,
  contenido text,
  anclaje_legal text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    conocimiento_legal.id,
    conocimiento_legal.titulo,
    conocimiento_legal.contenido,
    conocimiento_legal.anclaje_legal,
    1 - (conocimiento_legal.embedding <=> query_embedding) as similarity
  from conocimiento_legal
  where 1 - (conocimiento_legal.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
