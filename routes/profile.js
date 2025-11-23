router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid token",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const userId = decoded.id;

    const { data, error } = await supabase
      .from("drivers")
      .select("id, full_name, phone, email, vehicle_model, license_plate, rating")
      .eq("id", userId)
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Failed to fetch driver profile",
      });
    }

    return res.status(200).json({
      success: true,
      profile: data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});
