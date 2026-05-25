import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const adminEmails = [
  'nexaraiastudio@gmail.com',
  'bermudezcarlose1977@gmail.com',
];

async function assignAdminRoles() {
  console.log('Fetching existing users and assigning admin roles...\n');

  // Get all users (admin API)
  const { data, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error fetching users:', listError.message);
    process.exit(1);
  }

  const users = data?.users || [];

  for (const email of adminEmails) {
    const user = users.find((u) => u.email === email);

    if (!user) {
      console.log(`⚠ User not found: ${email}`);
      continue;
    }

    console.log(`Assigning admin role to: ${email}`);
    console.log(`  User ID: ${user.id}`);

    // First delete if exists, then insert
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    // Insert the admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{ user_id: user.id, role: 'admin' }]);

    if (roleError) {
      console.error(`  ❌ Error: ${roleError.message}`);
    } else {
      console.log(`  ✓ Role assigned: admin\n`);
    }
  }

  console.log('Done.');
}

assignAdminRoles();
