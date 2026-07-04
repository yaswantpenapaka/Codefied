const { getSolvedCount, getLeaderboard } = require("../utils/solvedStats");

exports.getProfile = async (req, res) => {
  const solvedCount = await getSolvedCount(req.user._id);

  return res.json({
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

exports.getLeaderboard = async (req, res) => {
  const leaderboard = await getLeaderboard(50);
  return res.json({ success: true, leaderboard });
};