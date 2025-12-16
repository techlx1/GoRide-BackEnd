import supabase from "../config/supabaseClient.js";
import crypto from "crypto";

export const getReferralInfo = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const driverId = req.user.id;

    // 1️⃣ Check existing referral
    const { data: existing, error: fetchErr } = await supabase
      .from("referrals")
      .select("referral_code, share_link")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existing) {
      return res.json({
        success: true,
        referral_code: existing.referral_code,
        share_link: existing.share_link,
      });
    }

    // 2️⃣ Generate SAFE unique code
    const code = "GR" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const link = `https://g-ride.app/signup?ref=${code}`;

    // 3️⃣ Insert referral
    const { data: inserted, error: insertErr } = await supabase
      .from("referrals")
      .insert([
        {
          driver_id: driverId,
          referral_code: code,
          share_link: link,
        },
      ])
      .select("referral_code, share_link")
      .maybeSingle();

    if (insertErr) throw insertErr;

    return res.json({
      success: true,
      referral_code: inserted.referral_code,
      share_link: inserted.share_link,
    });
  } catch (err) {
    console.error("❌ Referral Error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to generate referral",
    });
  }
};
