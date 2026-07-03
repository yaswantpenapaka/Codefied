const User = require("../models/User");
const Submission = require("../models/Submission");

exports.getProfile = async (req, res) => {
  const solvedData = await Submission.aggregate([
    { $match: { userId: req.user._id, verdict: "accepted" } },
    { $group: { _id: "$problemId" } },
    { $count: "count" },
  ]);

  return res.json({
    success: true,
    user: {
      id: req.user._id,
      handle: req.user.handle,
      email: req.user.email,
      role: req.user.role,
      solvedCount: solvedData[0]?.count || 0,
    },
  });
};

exports.getLeaderboard = async (req, res) => {
  const leaderboard = await Submission.aggregate([
    { $match: { verdict: "accepted" } },
    { $group: { _id: { userId: "$userId", problemId: "$problemId" } } },
    { $group: { _id: "$_id.userId", solvedCount: { $sum: 1 } } },
    { $sort: { solvedCount: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        userId: "$_id",
        handle: "$user.handle",
        email: "$user.email",
        solvedCount: 1,
      },
    },
    { $limit: 50 },
  ]);

  return res.json({ success: true, leaderboard });
};
