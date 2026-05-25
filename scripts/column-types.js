import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rmuqhrfahzkxtjedjxip.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  const { data, error } = await supabase.rpc('sql', {
    sql: `SELECT column_name, data_type, udt_name
          FROM information_schema.columns
          WHERE table_name='conocimiento_legal';`
  });
  console.log('result', { data, error });
}

main();
