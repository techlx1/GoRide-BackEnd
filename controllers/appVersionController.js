import supabase from "../config/supabaseClient.js";

export const getAppVersion = async (req, res) => {
  try {
    const platform = req.query.platform || "android";

    const { data, error } = await supabase
      .from("app_versions")
      .select("*")
      .eq("platform", platform)
      .maybeSingle();

    if (error) throw error;

    return res.json({
      success: true,
      latest_version: data.latest_version,
      min_supported_version: data.min_supported_version,
      update_url: data.update_url,
    });

  } catch (err) {
    console.error("Version Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch app version",
    });
  }
};
