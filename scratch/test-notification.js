const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNotification() {
  console.log("Sending test notification to Supabase...");
  
  const { data, error } = await supabase
    .from('app_notifications')
    .insert({
      title: "SYSTEM TEST: Notification Active",
      body: "Your Industrial Bronze notification system is online and synchronized with Supabase Real-time.",
      stage_code: 'test-sync'
    })
    .select();

  if (error) {
    console.error("Test failed:", error);
  } else {
    console.log("Test notification inserted successfully! Check your dashboard.");
  }
}

testNotification();
