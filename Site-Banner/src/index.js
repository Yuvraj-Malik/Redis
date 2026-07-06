import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    // Keep trying in dev so the API recovers if Redis starts later.
    retryStrategy: (times) => Math.min(times * 200, 2000),
});

let redisErrorLogged = false;
redis.on("error", (err) => {
    // Log once when Redis is unavailable to avoid noisy retry spam in dev.
    if (!redisErrorLogged) {
        redisErrorLogged = true;
        console.error("Redis connection error:", err.message || "Unable to connect");
    }
});

redis.on("ready", () => {
    if (redisErrorLogged) {
        console.log("Redis connection restored");
        redisErrorLogged = false;
    }
});

const BANNER_KEY = "app:banner";

app.post("/banner", async (req, res) => {
    try {
        await redis.set(BANNER_KEY, req.body.message || "No banner message provided");
        res.json({ success: true });
    } catch (error) {
        res.status(503).json({ success: false, error: "Redis unavailable" });
    }
});

app.get("/banner", async (req, res) => {
    try {
        const message = await redis.get(BANNER_KEY);
        res.json({ message });
    } catch (error) {
        res.status(503).json({ message: null, error: "Redis unavailable" });
    }
});

app.delete("/banner", async (req, res) => {
    try {
        await redis.del(BANNER_KEY);
        res.json({ success: true });
    } catch (error) {
        res.status(503).json({ success: false, error: "Redis unavailable" });
    }
});

app.get("/banner/exists", async (req, res) => {
    try {
        const exists = await redis.exists(BANNER_KEY);
        res.json({ exists: exists === 1});
    } catch (error) {
        res.status(503).json({ exists: false, error: "Redis unavailable" });
    }
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});