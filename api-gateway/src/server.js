import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import proxy from "express-http-proxy";

import logger from "./utils/logger";
import errorHandler from "../../identity-service/src/middlewares/errorHandler";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet);
app.use(cors());
app.use(express.json());

// rate limiting
const rateLimit = rateLimit({
  windowMs: 15 * 60 * 100,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(rateLimit);

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body ${req.body} `);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, req, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res
      .status(500)
      .json({ message: `Internal server error`, error: err.message });
  },
};

// setting up proxy for the identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxy,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on PORT ${PORT}`);
  logger.info(
    `Identity service is runnig on PORT ${process.env.IDENTITY_SERVICE_URL}`
  );
  logger.info(`Redis Url ${process.env.REDIS_URL}`);
});
