import jwt from "jsonwebtoken";
import crypto from "crypto";

import RefreshToken from "../models/RefreshToken.js";

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "15min" }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expires_at = new Date();

  expires_at.setDate(expires_at.getDate() + 7); // refresh token to expire after 7 days

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expires_at,
  });

  return { accessToken, refreshToken };
};

export default generateTokens;
