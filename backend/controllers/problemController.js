const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");
const slugify = require("slugify");

exports.listProblems = async (req, res) => {
  const Submission = require("../models/Submission");
  const mongoose = require("mongoose");
  const problems = await Problem.find().sort({ createdAt: -1 });

  const userId = new mongoose.Types.ObjectId(req.user._id);
  const solvedAgg = await Submission.aggregate([
    { $match: { userId, verdict: "accepted" } },
    { $group: { _id: "$problemId" } },
  ]);
  const solvedIds = new Set(solvedAgg.map((s) => s._id.toString()));

  const problemsWithStatus = problems.map((p) => ({
    ...p.toObject(),
    solved: solvedIds.has(p._id.toString()),
  }));

  const solvedCount = solvedIds.size;

  res.json({ problems: problemsWithStatus, solvedCount, totalCount: problems.length });
};

exports.getProblem = async (req, res) => {
  const Submission = require("../models/Submission");
  const problem = await Problem.findById(req.params.id);
  if (!problem) return res.status(404).json({ message: "Problem not found" });

  const solved = await Submission.exists({
    userId: req.user._id,
    problemId: problem._id,
    verdict: "accepted",
  });

  res.json({ problem: { ...problem.toObject(), solved: Boolean(solved) } });
};

exports.createProblem = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const {
    title,
    description,
    difficulty,
    constraints,
    timeLimit,
    memoryLimit,
    tags,
    sampleCases,
    hiddenCases,
    starterCode,
  } = req.body;

  const sampleCasesArray = Array.isArray(sampleCases)
    ? sampleCases.filter(
        (item) => item && (item.input.trim() || item.expectedOutput.trim()),
      )
    : [];

  const problem = await Problem.create({
    title,
    slug: slugify(title, { lower: true, strict: true }),
    description,
    difficulty,
    constraints,
    timeLimit,
    memoryLimit,
    tags,
    sampleCases: sampleCasesArray,
    sampleInput: sampleCasesArray[0]?.input || "",
    sampleOutput: sampleCasesArray[0]?.expectedOutput || "",
    createdBy: req.user._id,
    starterCode: starterCode || "",
  });

  const hiddenArray = Array.isArray(hiddenCases)
    ? hiddenCases
    : typeof hiddenCases === "string"
      ? hiddenCases
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [input, expectedOutput] = line.split("|");
            return {
              input: input?.trim() || "",
              expectedOutput: expectedOutput?.trim() || "",
            };
          })
      : [];

  for (let i = 0; i < hiddenArray.length; i += 1) {
    const hidden = hiddenArray[i];
    if (hidden.input && hidden.expectedOutput) {
      await TestCase.create({
        problemId: problem._id,
        input: hidden.input,
        expectedOutput: hidden.expectedOutput,
        isHidden: true,
        order: i + 1,
      });
    }
  }

  res.status(201).json({ problem });
};
