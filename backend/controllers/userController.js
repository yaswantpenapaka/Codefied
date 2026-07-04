const User = require("../models/User");
const { getSolvedCount, getLeaderboard } = require("../utils/solvedStats");

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("handle email role");
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const solvedCount = await getSolvedCount(user._id);

  return res.json({
    success: true,
    user: {
      id: user._id,
      handle: user.handle,
      email: user.email,
      role: user.role,
      solvedCount,
    },
  });
};

exports.getLeaderboard = async (req, res) => {
  const leaderboard = await getLeaderboard(50);
  return res.json({ success: true, leaderboard });
};