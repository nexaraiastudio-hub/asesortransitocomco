import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
const key = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.rpc('pg_table_def', {
    tablename: 'conocimiento_legal'
  });
  if (error) console.error('RPC error', error);
  else console.log(data);
}

main();
