const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  handle: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "user" },
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);