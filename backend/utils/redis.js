const Redis = require("ioredis");
const { buildRedisOptions } = require("./redisConfig");

const client = new Redis(buildRedisOptions());

client.on("error", (err) => {
  console.error("Redis error:", err);
});

module.exports = client;
