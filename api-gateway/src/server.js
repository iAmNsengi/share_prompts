import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet);
app.use(cors());
app.use(express.json());

// rate limiting
