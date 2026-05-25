import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Running database migration...\n');

  // Read SQL migration
  const migrationSQL = fs.readFileSync(
    'supabase/migrations/20260303000001_create_missing_tables.sql',
    'utf-8'
  );

  // Split by semicolons and filter empty statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
    
    try {
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);
      
      // Execute using RPC or direct SQL
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        // If exec_sql doesn't exist, try a different approach
        throw error;
      }
      
      console.log(`  ✓ OK\n`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log(`\nResults: ${successCount} ✓ successful, ${errorCount} ❌ failed\n`);
  
  if (errorCount > 0) {
    console.log('⚠️  Note: Some statements failed.');
    console.log('   This might be because:');
    console.log('   1. Tables already exist (harmless with IF NOT EXISTS)');
    console.log('   2. RPC functions are not deployed\n');
    console.log('   SOLUTION: Apply migration manually in Supabase dashboard:');
    console.log('   1. Go to: https://app.supabase.com/');
    console.log('   2. Select your project');
    console.log('   3. SQL Editor → New Query');
    console.log('   4. Copy contents of: supabase/migrations/20260303000001_create_missing_tables.sql');
    console.log('   5. Execute\n');
  }

  console.log('✅ Migration attempt complete.');
}

// Try to run migration
runMigration().catch(err => {
  console.error('Fatal error:', err.message);
  console.log('\nManual SQL execution required:');
  console.log('Copy the SQL from supabase/migrations/20260303000001_create_missing_tables.sql');
  console.log('and run it in the Supabase SQL Editor.');
});
