import db from "../config/db.js";

export const updateDriverStatus = async (req, res) => {
  try {
    const profileId = req.user.id;
    const { is_online, current_lat, current_lng, is_on_trip } = req.body;

    const result = await db.query(
      `
      INSERT INTO driver_status (profile_id, is_online, current_lat, current_lng, is_on_trip)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (profile_id) DO UPDATE SET
        is_online = EXCLUDED.is_online,
        current_lat = EXCLUDED.current_lat,
        current_lng = EXCLUDED.current_lng,
        is_on_trip = EXCLUDED.is_on_trip,
        last_active = NOW()
      RETURNING *;
      `,
      [profileId, is_online, current_lat, current_lng, is_on_trip]
    );

    res.json({ success: true, status: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
