import User from "../models/User.js";
import generateTokens from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import { validateRegistration } from "../utils/validations.js";

export const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit....");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const { email, password, username } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists ");
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    user = new User({ username, email, pasword });

    await user.save();
    logger.info("User saved successfully", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    return res.json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occurred", error);
    return res
      .status(500)
      .json({ succes: false, message: "Registration error occurred" });
  }
};
