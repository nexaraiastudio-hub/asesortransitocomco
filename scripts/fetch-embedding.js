import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rmuqhrfahzkxtjedjxip.supabase.co', process.env.SUPABASE_SERVICE_KEY);
(async () => {
  const { data, error } = await supabase.from('conocimiento_legal').select('id, embedding').limit(1);
  console.log({ data, error });
})();
