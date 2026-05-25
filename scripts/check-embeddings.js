import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const { data, count, error } = await supabase
    .from('conocimiento_legal')
    .select('id, titulo', { count: 'exact' })
    .is('embedding', null)
    .limit(10);

  if (error) {
    console.error('Error querying Supabase:', error.message || error);
    process.exit(1);
  }

  console.log(`Filas sin embedding (muestra hasta 10): ${count ?? 0}`);
  if (data && data.length > 0) {
    console.log('IDs (muestra):', data.map((r) => r.id).join(', '));
    console.log('Títulos (muestra):');
    data.forEach((r) => console.log(`- [${r.id}] ${r.titulo.substring(0, 80)}`));
  }

  process.exit(0);
}

main();
