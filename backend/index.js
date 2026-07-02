const express = require("express");
const app = express();
const cors = require("cors");
const generateFile = require("./generateFile");
const generateInputFile = require("./generateInputFile");
const executeCode = require("./executeCode");
const { aiCodereview } = require("./aiCodereview");

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello, World! CodeRunner backend with custom input is running.");
});

app.post("/run", async (req, res) => {
  const { language = "cpp", code, input } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }
  if (!["c", "cpp", "java", "python"].includes(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  try {
    // New sandboxed execution (no file generation needed)
    const output = await executeCode(code, input || "", language);

    res.json({ output });
  } catch (error) {
    console.error("Error in /run:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

app.post("/aiReview", async (req, res) => {
  const { code } = req.body;
  if (code === undefined) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const aiReview = await aiCodereview(code);
    res.json({ aiReview });
  } catch (error) {
    console.error("Error in /aiReview endpoint:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message || String(error),
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
