const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");
const Submission = require("../models/Submission");
const executeCode = require("../executeCode");

exports.runSample = async (req, res) => {
  const { code, language, input } = req.body;
  const problem = await Problem.findById(req.params.id);
  if (!problem) return res.status(404).json({ message: "Problem not found" });

  const sampleCases = input
    ? [
        {
          input,
          expectedOutput: problem.sampleOutput || "",
        },
      ]
    : problem.sampleCases && problem.sampleCases.length
      ? problem.sampleCases
      : [
          {
            input: problem.sampleInput || "",
            expectedOutput: problem.sampleOutput || "",
          },
        ];

  const results = [];
  let passed = 0;

  for (const tc of sampleCases) {
    const output = await executeCode(code, tc.input, language);
    const actual = output.stdout || output.stderr || "";
    const matched = actual.trim() === tc.expectedOutput.trim();
    if (matched) passed += 1;

    results.push({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      output: actual,
      passed: matched,
    });
  }

  res.json({ status: "sample", passed, total: sampleCases.length, results });
};

exports.submit = async (req, res) => {
  const { code, language } = req.body;
  const problem = await Problem.findById(req.params.id);
  if (!problem) return res.status(404).json({ message: "Problem not found" });

  const hiddenCases = await TestCase.find({
    problemId: problem._id,
    isHidden: true,
  }).sort({ order: 1 });

  if (!hiddenCases.length) {
    return res.status(400).json({
      message: "This problem has no hidden test cases configured yet.",
    });
  }

  const alreadySolved = await Submission.exists({
    userId: req.user._id,
    problemId: problem._id,
    verdict: "accepted",
  });

  const results = [];
  let passed = 0;

  for (const tc of hiddenCases) {
    const output = await executeCode(code, tc.input, language);
    const actual = output.stdout || output.stderr || "";
    const matched = actual.trim() === tc.expectedOutput.trim();
    if (matched) passed += 1;

    results.push({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      output: actual,
      passed: matched,
    });
  }

  await Submission.create({
    userId: req.user._id,
    problemId: problem._id,
    code,
    language,
    verdict: passed === hiddenCases.length ? "accepted" : "wrong-answer",
    results,
  });

  const accepted = passed === hiddenCases.length;
  const newlySolved = accepted && !alreadySolved;

  res.json({
    status: "submit",
    passed,
    total: hiddenCases.length,
    accepted,
    newlySolved,
    results,
  });
};
