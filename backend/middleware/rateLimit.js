const redis = require("../utils/redis");

const aiReviewRateLimit = async (req, res, next) => {
  const userId = req.user._id.toString();
  const hourlyKey = `rate:aiReview:hourly:${userId}`;
  const dailyKey = `rate:aiReview:daily:${userId}`;

  const [hourlyCount, dailyCount] = await Promise.all([
    redis.incr(hourlyKey),
    redis.incr(dailyKey),
  ]);

  if (hourlyCount === 1) {
    await redis.expire(hourlyKey, 60 * 60);
  }
  if (dailyCount === 1) {
    await redis.expire(dailyKey, 24 * 60 * 60);
  }

  const hourlyLimit = 2;
  const dailyLimit = 8;

  if (hourlyCount > hourlyLimit) {
    return res.status(429).json({
      success: false,
      message: `Hourly AI review limit exceeded (${hourlyLimit}/hour). Try again later.`,
    });
  }

  if (dailyCount > dailyLimit) {
    return res.status(429).json({
      success: false,
      message: `Daily AI review limit exceeded (${dailyLimit}/day). Try again tomorrow.`,
    });
  }

  next();
};

module.exports = { aiReviewRateLimit };
