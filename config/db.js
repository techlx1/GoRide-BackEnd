// config/db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  host: "db.tkzoguzixmixtxskqsnj.supabase.co", // your Supabase project host
});

export default pool;
