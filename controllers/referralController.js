import supabase from "../config/supabaseClient.js";

export const getReferralInfo = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Check if driver already has referral record
    let { data, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("driver_id", driverId)
      .maybeSingle();

    if (error) throw error;

    // If missing, create referral code
    if (!data) {
      const code = "GR" + driverId.replace(/-/g, "").slice(0, 8).toUpperCase();
      const link = `https://g-ride.app/signup?ref=${code}`;

      const { data: newRef, error: insertErr } = await supabase
        .from("referrals")
        .insert([
          {
            driver_id: driverId,
            referral_code: code,
            share_link: link,
          },
        ])
        .select()
        .maybeSingle();

      if (insertErr) throw insertErr;

      data = newRef;
    }

    return res.json({
      success: true,
      referral_code: data.referral_code,
      share_link: data.share_link,
    });
  } catch (err) {
    console.error("Referral Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
