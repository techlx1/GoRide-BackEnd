// config/db.js
import postgres from 'postgres'
import pkg from "pg";
const { Pool } = pkg;

// ✅ PostgreSQL connection pool

const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString)

export default sql