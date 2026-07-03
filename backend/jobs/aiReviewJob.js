const { Queue, Worker, QueueEvents } = require("bullmq");
const { aiCodereview } = require("../aiCodereview");
const { buildRedisOptions } = require("../utils/redisConfig");

const connection = buildRedisOptions();

const aiReviewQueue = new Queue("aiReview", { connection });
const aiReviewQueueEvents = new QueueEvents("aiReview", { connection });

const aiReviewWorker = new Worker(
  "aiReview",
  async (job) => {
    const { code } = job.data;
    const review = await aiCodereview(code);
    return { review };
  },
  { connection },
);

aiReviewWorker.on("failed", (job, err) => {
  console.error(`AI review job failed for ${job.id}:`, err.message);
});

module.exports = { aiReviewQueue, aiReviewQueueEvents };
