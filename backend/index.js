const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const userRoutes = require("./routes/userRoutes");
const executeCode = require("./executeCode");
const auth = require("./middleware/auth");
const { aiReviewRateLimit } = require("./middleware/rateLimit");
const { aiCodereview } = require("./aiCodereview");

connectDB();

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(
          `CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(", ")}`,
        );
        callback(null, false);
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello, World! CodeRunner backend with custom input is running.");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);

app.post("/api/compiler/run", async (req, res) => {
  const { language = "cpp", code, input } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Code is required" });
  }
  try {
    const output = await executeCode(code, input || "", language);
    res.json({ output });
  } catch (error) {
    console.error("Error in /api/compiler/run:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
});

const handleAiReview = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Code is required" });
  }

  try {
    const review = await aiCodereview(code);
    res.json({ aiReview: review });
  } catch (error) {
    console.error("Error in AI review queue:", error);
    res.status(500).json({ message: error.message || "AI review failed" });
  }
};

app.post("/api/compiler/aiReview", auth, aiReviewRateLimit, handleAiReview);
app.post("/aiReview", auth, aiReviewRateLimit, handleAiReview);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
