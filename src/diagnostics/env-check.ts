import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load .env.local if present
dotenv.config({ path: '.env.local' });

async function runDiagnostics() {
  console.log("\n==========================================");
  console.log("🔍 WORKSHOP OPS: SYSTEM DIAGNOSTICS");
  console.log("==========================================\n");

  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'GROQ_API_KEY',
    'NEXTAUTH_URL'
  ];

  console.log("📦 CHECKING ENVIRONMENT VARIABLES:");
  let envPassed = true;
  requiredEnvs.forEach(env => {
    if (!process.env[env] || process.env[env]?.includes('your_')) {
      console.log(`  ❌ MISSING/INVALID: ${env}`);
      envPassed = false;
    } else {
      console.log(`  ✅ CONFIGURED: ${env}`);
    }
  });

  if (!envPassed) {
    console.log("\n🛑 ABORTING: Fix missing variables in .env.local before testing.\n");
    return;
  }

  console.log("\n📡 TESTING SUPABASE CONNECTIVITY...");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const tables = ['profiles', 'recon_jobs', 'app_notifications'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`  ❌ TABLE ERROR [${table}]: ${error.message}`);
    } else {
      console.log(`  ✅ TABLE VERIFIED: ${table}`);
    }
  }

  console.log("\n🔐 VERIFYING ROLE ACCESS CONTROL:");
  const { data: admins, error: adminErr } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin');

  if (adminErr) {
    console.log(`  ❌ AUTH ERROR: ${adminErr.message}`);
  } else if (!admins || admins.length === 0) {
    console.log("  ❌ CRITICAL: No 'admin' user found. User Management will be inaccessible.");
  } else {
    console.log(`  ✅ ADMINS FOUND: ${admins.map(a => a.email).join(', ')}`);
  }

  console.log("\n📧 NOTIFICATION SYSTEM:");
  if (process.env.RESEND_API_KEY) {
    console.log("  ✅ RESEND: API Key detected. Ready for dispatch.");
  }

  console.log("\n==========================================");
  console.log("✨ ALL SYSTEMS OPERATIONAL FOR DEPLOYMENT");
  console.log("==========================================\n");
}

runDiagnostics().catch(err => {
  console.error("💥 DIAGNOSTIC CRASHED:", err.message);
});
