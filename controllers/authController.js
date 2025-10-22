import crypto from "crypto";

// 📨 STEP 1: Request password reset (generate and store OTP)
export const requestPasswordReset = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required to request password reset.",
      });
    }

    // Find user by email or phone
    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`email.eq.${email},phone.eq.${phone}`)
      .maybeSingle();

    if (error) throw error;
    if (!user)
      return res.status(404).json({
        success: false,
        message: "No account found with this email or phone.",
      });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP in a temporary table
    const { error: insertError } = await supabase.from("password_resets").upsert({
      user_id: user.id,
      otp,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) throw insertError;

    // (Optional) send email or SMS here
    console.log(`🔑 OTP for ${email || phone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully. (Check email/SMS)",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ STEP 2: Verify OTP and update password
export const verifyPasswordReset = async (req, res) => {
  try {
    const { email, phone, otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "OTP and new password are required.",
      });
    }

    // Find user
    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .or(`email.eq.${email},phone.eq.${phone}`)
      .maybeSingle();

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    // Verify OTP
    const { data: resetRecord } = await supabase
      .from("password_resets")
      .select("*")
      .eq("user_id", user.id)
      .eq("otp", otp)
      .maybeSingle();

    if (!resetRecord)
      return res.status(400).json({ success: false, message: "Invalid OTP." });

    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ password: hashedPassword, updated_at: new Date() })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // Delete used OTP
    await supabase.from("password_resets").delete().eq("user_id", user.id);

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
