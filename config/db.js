// config/db.js
import pkg from "pg";
const { Pool } = pkg;

// ✅ PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default pool;
