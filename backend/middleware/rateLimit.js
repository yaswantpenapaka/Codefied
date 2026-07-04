const getRedis = require("../utils/redis");

const memoryBuckets = new Map();

const bumpMemoryCounter = (key, ttlMs) => {
  const now = Date.now();
  const entry = memoryBuckets.get(key);
  if (!entry || entry.expiresAt <= now) {
    memoryBuckets.set(key, { count: 1, expiresAt: now + ttlMs });
    return 1;
  }
  entry.count += 1;
  return entry.count;
};

const aiReviewRateLimit = async (req, res, next) => {
  const userId = req.user._id.toString();
  const hourlyKey = `rate:aiReview:hourly:${userId}`;
  const dailyKey = `rate:aiReview:daily:${userId}`;
  const hourlyLimit = 2;
  const dailyLimit = 8;

  try {
    const redis = getRedis();
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
  } catch (err) {
    console.warn("Redis rate limit unavailable, using in-memory fallback:", err.message);
    const hourlyCount = bumpMemoryCounter(hourlyKey, 60 * 60 * 1000);
    const dailyCount = bumpMemoryCounter(dailyKey, 24 * 60 * 60 * 1000);

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
  }

  next();
};

module.exports = { aiReviewRateLimit };