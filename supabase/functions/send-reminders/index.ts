// supabase/functions/send-reminders/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✅ Custom environment variable names (since SUPABASE_ prefix is reserved)
const supabaseUrl = Deno.env.get("MY_SUPABASE_URL");
const supabaseKey = Deno.env.get("MY_SUPABASE_SERVICE_ROLE_KEY");

// 🚨 Check for missing variables
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables: MY_SUPABASE_URL or MY_SUPABASE_SERVICE_ROLE_KEY");
  throw new Error("Missing environment variables");
}

// ✅ Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// 🧠 Start Edge Function
Deno.serve(async (req) => {
  console.log("🚀 send-reminders function started");

  try {
    // 🗃️ Fetch driver data from your 'profiles' table
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
    if (profiles?.length) {
      console.log("Sample record:", profiles[0]);
    }

    let totalNotified = 0;
    for (const driver of profiles || []) {
      if (!driver.fcm_token) continue;
      // In a future version, you’ll send push notifications here
      console.log(`📲 Would send reminder to ${driver.full_name}`);
      totalNotified++;
    }

    console.log(`✅ Done! ${totalNotified} notifications ready.`);

    return new Response(
      JSON.stringify({
        success: true,
        total_notified: totalNotified,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("🔥 Unhandled error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
