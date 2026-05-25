import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rmuqhrfahzkxtjedjxip.supabase.co';
// use service key here because publishable key seems invalid in this project
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY; // WARNING: this bypasses normal auth rules for testing only


// Use anon key like the browser app does
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  console.log('🔐 Simulating browser login flow...\n');

  const email = 'nexaraiastudio@gmail.com';
  const password = 'charly2026';

  try {
    // Step 1: Sign in
    console.log(`Step 1: Signing in as ${email}...`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error(`❌ Sign-in failed: ${signInError.message}`);
      process.exit(1);
    }

    const user = signInData.user;
    console.log(`✓ Signed in: ${user.id}`);
    console.log(`  Email verified: ${user.email_confirmed_at ? '✓' : '✗'}`);

    // Step 2: Check admin role (like Auth.tsx does)
    console.log('\nStep 2: Checking admin role...');
    const { data: isAdmin, error: adminError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (adminError) {
      console.error(`❌ RPC error: ${adminError.message}`);
    } else {
      console.log(`✓ has_role returned: ${isAdmin}`);
      if (isAdmin === true) {
        console.log('✓ ADMIN DETECTED → Should redirect to /chat');
        process.exit(0);
      }
    }

    // Step 3: If not admin, check subscription
    console.log('\nStep 3: Checking subscription (fallback)...');
    const { data: hasSub, error: subError } = await supabase.rpc('has_active_subscription', {
      _user_id: user.id,
    });

    if (subError) {
      console.error(`❌ Subscription check error: ${subError.message}`);
      console.log('⚠ RPC might not exist or RLS might be blocking');
    } else {
      console.log(`✓ has_active_subscription returned: ${hasSub}`);
      if (hasSub !== true) {
        console.log('⚠ No active subscription → Would redirect to /payment');
      }
    }

    // Step 4: Try to fetch user profile
    console.log('\nStep 4: Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error(`❌ Profile fetch error: ${profileError.message}`);
      console.log('⚠ RLS might be blocking access to profiles table');
    } else {
      console.log(`✓ Profile found: ${profile?.full_name || '(no name)'}`);
    }
  } catch (err) {
    console.error(`❌ Unexpected error: ${err.message}`);
  }

  console.log('\n✅ Login simulation complete.');
}

testLogin();
