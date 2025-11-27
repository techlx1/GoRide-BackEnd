import db from "../config/db.js";

/*
=========================================================
  1. UPDATE ENTIRE DRIVER STATUS (UPSERT)
=========================================================
*/
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
    console.error("updateDriverStatus Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/*
=========================================================
  2. UPDATE LOCATION ONLY
=========================================================
*/
export const updateDriverLocation = async (req, res) => {
  try {
    const profileId = req.user.id;
    const { current_lat, current_lng } = req.body;

    const result = await db.query(
      `
      UPDATE driver_status
      SET current_lat = $1, current_lng = $2, last_active = NOW()
      WHERE profile_id = $3
      RETURNING *;
      `,
      [current_lat, current_lng, profileId]
    );

    res.json({ success: true, location: result.rows[0] });

  } catch (err) {
    console.error("updateDriverLocation Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/*
=========================================================
  3. SET ONLINE/OFFLINE STATUS
=========================================================
*/
export const setOnlineStatus = async (req, res) => {
  try {
    const profileId = req.user.id;
    const { is_online } = req.body;

    const result = await db.query(
      `
      UPDATE driver_status
      SET is_online = $1, last_active = NOW()
      WHERE profile_id = $2
      RETURNING *;
      `,
      [is_online, profileId]
    );

    res.json({ success: true, status: result.rows[0] });

  } catch (err) {
    console.error("setOnlineStatus Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/*
=========================================================
  4. GET ALL ONLINE DRIVERS
=========================================================
*/
export const getOnlineDrivers = async () => {
  try {
    const result = await db.query(
      `
      SELECT profile_id, current_lat, current_lng, is_on_trip, last_active
      FROM driver_status
      WHERE is_online = true
      AND is_on_trip = false
      ORDER BY last_active DESC;
      `
    );

    return { success: true, drivers: result.rows };

  } catch (err) {
    console.error("getOnlineDrivers Error:", err);
    return { success: false, message: "Server error" };
  }
};
