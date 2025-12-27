// config/supabaseClient.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials. Please check your .env file.");
  process.exit(1);
}

// ✅ Create Supabase client (SERVER)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  }
);

// ✅ Export both named and default
export { supabase };
export default supabase;
