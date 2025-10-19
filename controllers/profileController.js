import { supabase } from "../server.js";

export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();

    if (error) throw error;

    res.status(200).json({ success: true, profile: data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, avatar_url, date_of_birth } = req.body;

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
        avatar_url,
        date_of_birth,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, profile: data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;

    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
