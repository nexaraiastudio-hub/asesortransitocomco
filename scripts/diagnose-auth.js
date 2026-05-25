import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnose() {
  console.log('🔍 Diagnostic check for admin users...\n');

  // 1. Obtain admin user IDs
  const adminEmails = [
    'nexaraiastudio@gmail.com',
    'bermudezcarlose1977@gmail.com',
  ];

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error fetching users:', listError.message);
    process.exit(1);
  }

  const adminUsers = users?.users?.filter((u) =>
    adminEmails.includes(u.email?.toLowerCase() || '')
  ) || [];

  if (adminUsers.length === 0) {
    console.error('❌ No admin users found in auth.users');
    process.exit(1);
  }

  console.log(`✓ Found ${adminUsers.length} admin users in auth.users`);
  for (const user of adminUsers) {
    console.log(`  - ${user.email} (ID: ${user.id})`);
    console.log(`    Email verified: ${user.email_confirmed_at ? '✓' : '✗'}`);
  }

  // 2. Check user_roles table
  console.log('\n📋 Checking user_roles table...');
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*');

  if (rolesError) {
    console.error('❌ Error reading user_roles:', rolesError.message);
  } else {
    console.log(`✓ user_roles table found (${roles?.length || 0} rows)`);
    const adminRoles = roles?.filter((r) => r.role === 'admin') || [];
    console.log(`  Admin roles: ${adminRoles.length}`);
    for (const role of adminRoles) {
      const matchingUser = adminUsers.find((u) => u.id === role.user_id);
      console.log(`  - User ID: ${role.user_id} (${matchingUser?.email || 'NOT FOUND'})`);
    }
  }

  // 3. Test has_role RPC
  console.log('\n🔐 Testing has_role RPC function...');
  for (const user of adminUsers) {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (error) {
        console.log(`❌ RPC error for ${user.email}: ${error.message}`);
      } else {
        console.log(`✓ ${user.email} has_role(admin) = ${data}`);
      }
    } catch (err) {
      console.log(`❌ Exception for ${user.email}: ${err.message}`);
    }
  }

  // 4. Test login manually
  console.log('\n🔑 Testing manual login...');
  const testUser = adminUsers[0];
  if (testUser?.email) {
    try {
      // Try with wrong password first to see if user exists
      const { error: wrongPassError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: 'wrong_password_12345',
      });

      if (wrongPassError?.message.includes('Invalid login credentials')) {
        console.log(`✓ User ${testUser.email} exists and can be queried`);
      } else if (wrongPassError) {
        console.log(`⚠ Unexpected error: ${wrongPassError.message}`);
      }
    } catch (err) {
      console.log(`❌ Login test error: ${err.message}`);
    }
  }

  console.log('\n✅ Diagnostic complete.');
}

diagnose();
