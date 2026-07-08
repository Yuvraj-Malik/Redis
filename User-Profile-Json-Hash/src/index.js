import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.post("/user/:id/json", async (req, res) => {
    await redis.set(`user:${req.params.id}:json`, JSON.stringify(req.body));
    res.json({savedAs: "json"});
});


app.get("/user/:id/json", async (req, res) => {
    const raw = await redis.get(`user:${req.params.id}:json`);
    res.json({user: raw ? JSON.parse(raw) : null});
});

app.post("/user/:id/hash", async (req, res) => {
    await redis.hset(`user:${req.params.id}`, req.body);
    res.json({savedAs: "hash"});
});

app.get("/user/:id/hash", async (req, res) => {
    const user = await redis.hgetall(`user:${req.params.id}`);
    res.json({user});
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
})