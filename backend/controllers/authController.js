const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/password");
const { getSolvedCount } = require("../utils/solvedStats");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");
const { getRefreshCookieOptions } = require("../utils/cookies");

const findUserByIdentifier = async (identifier) => {
  if (!identifier) return null;
  return User.findOne({ $or: [{ email: identifier }, { handle: identifier }] });
};

const validatePassword = async (user, password) => {
  if (user.passwordHash) {
    return comparePassword(password, user.passwordHash);
  }

  if (typeof user.password === "string") {
    const stored = user.password;

    // if the old password field contains a bcrypt hash, compare it directly
    if (
      stored.startsWith("$2a$") ||
      stored.startsWith("$2b$") ||
      stored.startsWith("$2y$")
    ) {
      const match = await comparePassword(password, stored);
      if (match) {
        const newHash = await hashPassword(password);
        await User.updateOne(
          { _id: user._id },
          { $set: { passwordHash: newHash }, $unset: { password: 1 } },
        );
      }
      return match;
    }

    if (password === stored) {
      const newHash = await hashPassword(password);
      await User.updateOne(
        { _id: user._id },
        { $set: { passwordHash: newHash }, $unset: { password: 1 } },
      );
      return true;
    }
    return false;
  }

  return false;
};

exports.register = async (req, res) => {
  const { handle, email, password, confirmPassword } = req.body;

  if (!handle || !email || !password || !confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  const exists = await User.findOne({ $or: [{ email }, { handle }] });
  if (exists) {
    return res
      .status(409)
      .json({ success: false, message: "User already exists" });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ handle, email, passwordHash, role: "user" });

  const accessToken = signAccessToken({
    id: user._id,
    handle: user.handle,
    role: user.role,
  });
  const refreshToken = signRefreshToken({
    id: user._id,
    tokenVersion: user.tokenVersion,
  });

  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

  const solvedCount = await getSolvedCount(user._id);

  res.status(201).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      handle: user.handle,
      email: user.email,
      role: user.role,
      solvedCount,
    },
  });
};

exports.login = async (req, res) => {
  try {
  const identifier = req.body.identifier || req.body.email || req.body.handle;
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Email/handle and password are required",
    });
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const match = await validatePassword(user, password);
  if (!match) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const accessToken = signAccessToken({
    id: user._id,
    handle: user.handle,
    role: user.role,
  });
  const refreshToken = signRefreshToken({
    id: user._id,
    tokenVersion: user.tokenVersion,
  });

  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

  const solvedCount = await getSolvedCount(user._id);

  res.json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      handle: user.handle,
      email: user.email,
      role: user.role,
      solvedCount,
    },
  });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed. Try again." });
  }
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = signAccessToken({
      id: user._id,
      handle: user.handle,
      role: user.role,
    });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("refreshToken", getRefreshCookieOptions());
  res.json({ success: true, message: "Logged out" });
};

exports.me = async (req, res) => {
  const solvedCount = await getSolvedCount(req.user._id);

  res.json({
    success: true,
    user: {
      id: req.user._id,
      handle: req.user.handle,
      email: req.user.email,
      role: req.user.role,
      solvedCount,
    },
  });
};
