import sys
import os

try:
    from supabase import create_client
except ImportError:
    print("ERROR: supabase-py no instalado. Instala con: pip install supabase")
    sys.exit(1)

try:
    from openai import OpenAI
except ImportError:
    print("ERROR: openai no instalado. Instala con: pip install openai")
    sys.exit(1)

def check_and_insert(norm_id, env_path, titulo=None, contenido=None, entidad=None):
    service_key = None
    supabase_url = None
    openai_key = None
    
    # Leer el .env del scratch
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip().startswith('SUPABASE_SERVICE_ROLE_KEY='):
                    service_key = line.strip().split('=', 1)[1].strip(' "\'')
                elif line.strip().startswith('SUPABASE_URL='):
                    supabase_url = line.strip().split('=', 1)[1].strip(' "\'')
    
    # Intentar leer OPENAI_API_KEY del .env principal de la app si no está en el scratch
    app_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
    if os.path.exists(app_env_path):
        with open(app_env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip().startswith('OPENAI_API_KEY='):
                    openai_key = line.strip().split('=', 1)[1].strip(' "\'')
                    
    if not service_key:
        print(f"ERROR: No se pudo encontrar SUPABASE_SERVICE_ROLE_KEY en {env_path}")
        sys.exit(1)
        
    if not supabase_url:
        supabase_url = "https://rmuqhrfahzkxtjedjxip.supabase.co"
        
    if not openai_key and titulo and contenido:
        print("ERROR: No se encontró OPENAI_API_KEY en el .env de la aplicación para generar el embedding.")
        sys.exit(1)
        
    try:
        supabase = create_client(supabase_url, service_key)
        
        # Buscar en la tabla conocimiento_legal
        result = supabase.table("conocimiento_legal").select("*").ilike("anclaje_legal", f"%{norm_id}%").execute()
        
        if result.data and len(result.data) > 0:
            print("EXISTS")
            return
            
        # Si no existe y pasaron el título y contenido, lo insertamos
        if titulo and contenido:
            # Generar embedding
            client = OpenAI(api_key=openai_key)
            texto_para_embedding = f"{titulo}\n\n{contenido}"
            
            response = client.embeddings.create(
                input=texto_para_embedding,
                model="text-embedding-ada-002"
            )
            embedding_vector = response.data[0].embedding
            
            anclaje = f"{norm_id}"
            if entidad:
                anclaje += f" ({entidad})"
                
            insert_data = {
                "titulo": titulo,
                "contenido": contenido,
                "anclaje_legal": anclaje,
                "embedding": embedding_vector,
                "tags": []
            }
            
            insert_result = supabase.table("conocimiento_legal").insert(insert_data).execute()
            if insert_result.data:
                print("NEW_INSERTED")
            else:
                print("ERROR: No se pudo insertar.")
        else:
            print("NEW")
            
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python check_db.py <identificador_norma> <ruta_env> [titulo] [contenido] [entidad]")
        sys.exit(1)
    
    norm_id = sys.argv[1]
    env_path = sys.argv[2]
    
    titulo = sys.argv[3] if len(sys.argv) > 3 else None
    contenido = sys.argv[4] if len(sys.argv) > 4 else None
    entidad = sys.argv[5] if len(sys.argv) > 5 else None
    
    check_and_insert(norm_id, env_path, titulo, contenido, entidad)
