const Submission = require("../models/Submission");

async function getSolvedProblemIds(userId) {
  const ids = await Submission.distinct("problemId", {
    userId,
    verdict: "accepted",
  });
  return new Set(ids.filter(Boolean).map((id) => id.toString()));
}

async function getSolvedCount(userId) {
  const ids = await getSolvedProblemIds(userId);
  return ids.size;
}

async function getLeaderboard(limit = 50) {
  return Submission.aggregate([
    { $match: { verdict: "accepted", problemId: { $ne: null }, userId: { $ne: null } } },
    {
      $group: {
        _id: {
          userId: "$userId",
          problemId: { $toString: "$problemId" },
        },
      },
    },
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
    { $limit: limit },
  ]);
}

module.exports = {
  getSolvedProblemIds,
  getSolvedCount,
  getLeaderboard,
};