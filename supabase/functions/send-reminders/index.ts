// supabase/functions/send-reminders/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✅ Load environment variables
const supabaseUrl = Deno.env.get("MY_SUPABASE_URL");
const supabaseKey = Deno.env.get("MY_SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// ✅ Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseKey!);

// ✅ Start Function Server
Deno.serve(async (req) => {
  console.log("🚀 send-reminders function started");

  try {
    // ✅ Fetch sample users (limit for testing)
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, fcm_token, driver_licence_expiry, insurance_expiry")
      .limit(5);

    if (error) {
      console.error("❌ Database query failed:", error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found ${profiles?.length || 0} profiles`);
    console.log("🧪 Sample record:", profiles?.[0]);

    // ✅ Fake reminder loop (for testing logic / logs)
    let totalNotified = 0;
    for (const driver of profiles || []) {
      if (!driver.fcm_token) continue;

      console.log(`📲 Would send reminder to: ${driver.full_name}`);
      totalNotified++;
    }

    console.log(`✅ Done! ${totalNotified} notifications ready`);

    return new Response(
      JSON.stringify({
        success: true,
        total_notified: totalNotified,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("🔥 Unhandled error:", err.message);

    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
