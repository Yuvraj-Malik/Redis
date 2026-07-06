import express from "express";
import Redis from "ioredis";

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function otpKey(phone) {
    return `otp:${phone}`;
}

app.post("/otp", async (req, res) => {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(otpKey(phone), otp, "EX", 30);

    res.json({
        message: "OTP sent successfully",
        otp
    });
});

app.post("/otp/verify", async (req, res) => {
    const { phone, otp } = req.body;

    const storedOtp = await redis.get(otpKey(phone));

    if (!storedOtp) {
        return res.status(400).json({
            message: "OTP has expired or does not exist"
        });
    }

    if (storedOtp !== otp) {
        return res.status(400).json({
            message: "Invalid OTP"
        });
    }

    await redis.del(otpKey(phone));

    res.json({
        message: "OTP verified successfully"
    });
});

app.get("/otp/:phone/ttl", async (req, res) => {
    const ttl = await redis.ttl(otpKey(req.params.phone));
    res.json({ ttl });
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});