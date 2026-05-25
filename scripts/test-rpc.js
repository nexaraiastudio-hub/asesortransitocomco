import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkRPCs() {
  console.log('🧪 Testing RPC Functions\n');

  // Get admin user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users?.find(u => u.email === 'nexaraiastudio@gmail.com');

  if (!adminUser) {
    console.error('❌ Admin user not found');
    process.exit(1);
  }

  const userId = adminUser.id;
  console.log(`Testing with user: ${adminUser.email} (${userId})\n`);

  // Test 1: has_role
  console.log('Test 1: has_role(user_id, "admin")');
  console.log('-----------------------------------');
  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (error) {
      console.error(`❌ Error: ${error.message}`);
      console.error(`   Code: ${error.code}`);
    } else {
      console.log(`✓ Response: ${data}`);
    }
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
  }

  // Test 2: has_active_subscription
  console.log('\nTest 2: has_active_subscription(user_id)');
  console.log('-----------------------------------------');
  try {
    const { data, error } = await supabase.rpc('has_active_subscription', {
      _user_id: userId,
    });

    if (error) {
      console.error(`❌ Error: ${error.message}`);
      console.error(`   Code: ${error.code}`);
    } else {
      console.log(`✓ Response: ${data}`);
    }
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
  }

  // Test 3: Check what's in user_roles table
  console.log('\nTest 3: Querying user_roles table directly');
  console.log('-------------------------------------------');
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.log(`✓ User roles (${data?.length || 0} rows):`);
      data?.forEach(row => {
        console.log(`  - ${row.user_id}: ${row.role}`);
      });
    }
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
  }

  // Test 4: Check profiles table
  console.log('\nTest 4: Querying profiles table directly');
  console.log('----------------------------------------');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);

    if (error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.log(`✓ Profile found: ${data?.length || 0} rows`);
      if (data && data.length > 0) {
        console.log(`  - ${JSON.stringify(data[0], null, 2)}`);
      }
    }
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
  }

  console.log('\n✅ RPC function tests complete.');
}

checkRPCs();
