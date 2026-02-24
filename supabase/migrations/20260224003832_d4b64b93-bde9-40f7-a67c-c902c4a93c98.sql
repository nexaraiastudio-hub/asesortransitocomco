
-- 1. Habilitar la extensión de vectores
create extension if not exists vector;

-- 2. Crear la tabla de conocimiento legal experto
create table public.conocimiento_legal (
  id bigserial primary key,
  titulo text not null,
  contenido text not null,
  anclaje_legal text,
  tags text[],
  embedding vector(1536)
);

-- 3. Habilitar RLS
alter table public.conocimiento_legal enable row level security;

-- 4. Políticas RLS
create policy "Authenticated users can read conocimiento_legal"
  on public.conocimiento_legal for select
  using (true);

create policy "Admins can insert conocimiento_legal"
  on public.conocimiento_legal for insert
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can update conocimiento_legal"
  on public.conocimiento_legal for update
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can delete conocimiento_legal"
  on public.conocimiento_legal for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- 5. Índice para búsqueda por vectores (IVFFlat)
create index on public.conocimiento_legal using ivfflat (embedding vector_cosine_ops) with (lists = 10);

-- 6. Función de búsqueda semántica
create or replace function public.buscar_conocimiento(
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
set search_path = 'public'
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
