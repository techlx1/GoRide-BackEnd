import Redis from "ioredis";

let redis = null;

if (process.env.REDIS_URL && process.env.REDIS_URL.trim() !== "") {
  redis = new Redis(process.env.REDIS_URL);

  redis.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });
} else {
  console.log("🚫 Redis DISABLED (REDIS_URL not set)");
}

export default redis;
