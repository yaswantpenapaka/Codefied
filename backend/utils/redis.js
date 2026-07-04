const Redis = require("ioredis");
const { buildRedisOptions } = require("./redisConfig");

let client = null;

function getRedis() {
  if (!client) {
    client = new Redis(buildRedisOptions());
    client.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
  }
  return client;
}

module.exports = getRedis;