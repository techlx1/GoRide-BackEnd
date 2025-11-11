// supabase/functions/notify-expiring-docs/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY")!;

const headers = {
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
};

serve(async () => {
  try {
    // 1️⃣ Get expiring documents from SQL function
    const docsRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_expiring_docs`, {
      headers,
      method: "POST",
    });
    const docs = await docsRes.json();

    if (!Array.isArray(docs) || docs.length === 0) {
      return new Response(JSON.stringify({ message: "No expiring docs found." }), { status: 200 });
    }

    // 2️⃣ Get driver tokens
    const driverIds = docs.map((d: any) => d.driver_id);
    const profRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=in.(${driverIds.join(",")})`,
      { headers }
    );
    const profiles = await profRes.json();

    // 3️⃣ Send FCM push notifications
    for (const doc of docs) {
      const driverProfile = profiles.find((p: any) => p.id === doc.driver_id);
      if (!driverProfile?.fcm_token) continue;

      const message = {
        to: driverProfile.fcm_token,
        notification: {
          title: "⚠️ Document Expiring Soon",
          body: `${doc.doc_type} expires on ${doc.expiry_date}. Please renew to stay active.`,
        },
      };

      await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      // 4️⃣ Mark as notified
      await fetch(`${SUPABASE_URL}/rest/v1/document_expiry`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ notified: true }),
      });
    }

    return new Response(JSON.stringify({ message: "Notifications sent successfully." }), { status: 200 });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
