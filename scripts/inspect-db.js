import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function inspectDatabase() {
  console.log('🔍 Inspecting Supabase database structure...\n');

  // 1. Check tables
  console.log('📊 1. TABLES IN PUBLIC SCHEMA');
  console.log('=====================================\n');
  
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tablesError) {
    console.error(`❌ Error fetching tables: ${tablesError.message}`);
  } else {
    const tableNames = tables?.map(t => t.table_name).filter(name => !name.startsWith('_')) || [];
    if (tableNames.length === 0) {
      console.log('❌ NO PUBLIC TABLES FOUND');
    } else {
      console.log(`✓ Found ${tableNames.length} tables:`);
      for (const name of tableNames) {
        console.log(`  - ${name}`);
      }
    }
  }

  // 2. Check specific critical tables
  console.log('\n📋 2. CHECKING CRITICAL TABLES');
  console.log('=====================================\n');

  const criticalTables = ['user_roles', 'profiles', 'conocimiento_legal'];
  
  for (const tableName of criticalTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(0);

    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    } else {
      console.log(`✓ ${tableName}: EXISTS (checking sample...)`);
      
      // Get column info
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', tableName);
      
      if (columns) {
        columns.forEach(col => {
          console.log(`    - ${col.column_name} (${col.data_type})`);
        });
      }
    }
  }

  // 3. Check RPC functions
  console.log('\n⚙️  3. RPC FUNCTIONS');
  console.log('=====================================\n');

  const { data: functions, error: functionsError } = await supabase
    .from('information_schema.routines')
    .select('routine_name, routine_type')
    .eq('routine_schema', 'public');

  if (functionsError) {
    console.error(`❌ Error fetching functions: ${functionsError.message}`);
  } else {
    const funcNames = functions?.map(f => f.routine_name) || [];
    if (funcNames.length === 0) {
      console.log('❌ NO PUBLIC FUNCTIONS FOUND');
    } else {
      console.log(`✓ Found ${funcNames.length} functions:`);
      for (const name of funcNames) {
        console.log(`  - ${name}`);
      }
      
      // Check critical functions
      const criticalFuncs = ['has_role', 'has_active_subscription'];
      console.log('\nCritical functions check:');
      for (const func of criticalFuncs) {
        if (funcNames.includes(func)) {
          console.log(`  ✓ ${func} EXISTS`);
        } else {
          console.log(`  ❌ ${func} MISSING`);
        }
      }
    }
  }

  // 4. Check RLS policies
  console.log('\n🔐 4. RLS POLICIES');
  console.log('=====================================\n');

  const { data: policies, error: policiesError } = await supabase
    .from('information_schema.role_table_grants')
    .select('table_name, privilege')
    .eq('table_schema', 'public');

  if (policiesError) {
    console.log(`⚠️  Cannot directly query RLS policies: ${policiesError.message}`);
    console.log('Recommend checking Supabase dashboard → Authentication → Policies');
  } else {
    console.log(`Found permission grants:`);
    const uniqueTables = [...new Set(policies?.map(p => p.table_name) || [])];
    for (const table of uniqueTables) {
      console.log(`  - ${table}`);
    }
  }

  // 5. Check auth.users
  console.log('\n👤 5. AUTH USERS');
  console.log('=====================================\n');

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error(`❌ Error fetching auth users: ${usersError.message}`);
  } else {
    const userCount = users?.users?.length || 0;
    console.log(`✓ Auth users: ${userCount}`);
    users?.users?.slice(0, 5).forEach(u => {
      console.log(`  - ${u.email} (verified: ${u.email_confirmed_at ? '✓' : '✗'})`);
    });
  }

  console.log('\n✅ Inspection complete. Review findings above to identify issues.');
  console.log('\nNEXT STEPS:');
  console.log('1. Ensure all critical tables exist: user_roles, profiles, conocimiento_legal');
  console.log('2. Ensure RPC functions exist: has_role, has_active_subscription');
  console.log('3. Check RLS policies in Supabase dashboard → Authentication → Policies');
  console.log('4. Verify migrations have run: supabase db push');
}

inspectDatabase();
