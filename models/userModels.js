import pool from "./db.js";

export const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM profiles WHERE email = $1", [email]);
  return result.rows[0];
};
