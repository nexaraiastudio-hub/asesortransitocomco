import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

// Initialize Supabase client with service key (admin privileges)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const adminsToCreate = [
  {
    email: 'nexaraiastudio@gmail.com',
    password: 'charly2026',
    name: 'Admin 1',
  },
  {
    email: 'bermudezcarlose1977@gmail.com',
    password: 'charly20220',
    name: 'Admin 2',
  },
];

async function createAdminUsers() {
  console.log('Starting admin user creation...\n');

  for (const admin of adminsToCreate) {
    try {
      console.log(`Creating user: ${admin.email}`);

      // Create user with auth.admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true, // Mark email as verified immediately
      });

      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
        continue;
      }

      const userId = data?.user?.id;
      console.log(`  ✓ User created: ${userId}`);

      // Set user as admin in your app
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: 'admin' }]);

      if (roleError) {
        // If table doesn't exist or insert fails, log but don't stop
        console.warn(`  ⚠ Role assignment failed: ${roleError.message}`);
        console.log('  (Create a user_roles table if needed)\n');
      } else {
        console.log(`  ✓ Role set to: admin`);
      }

      console.log(`  ✓ Email verified: true\n`);
    } catch (err) {
      console.error(`  ❌ Unexpected error for ${admin.email}:`, err);
    }
  }

  console.log('Done.');
}

createAdminUsers();
