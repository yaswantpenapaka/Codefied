const Problem = require("../models/Problem");
const TestCase = require("../models/TestCase");
const Submission = require("../models/Submission");
const { executeCodeCases } = require("../executeCode");
const {
  VERDICTS,
  resolveCaseVerdict,
  resolveSubmissionVerdict,
} = require("../utils/verdict");

const runCases = async (cases, code, language, timeLimitMs) => {
  const results = [];
  const caseVerdicts = [];
  let passed = 0;

  const outputs = await executeCodeCases(
    code,
    cases.map((tc) => tc.input),
    language,
    timeLimitMs,
  );

  for (let i = 0; i < cases.length; i += 1) {
    const tc = cases[i];
    const output = outputs[i] || outputs[0];
    const actual = output.stdout || output.stderr || "";
    const caseVerdict = resolveCaseVerdict(output, tc.expectedOutput);
    const matched = caseVerdict === VERDICTS.ACCEPTED;

    if (matched) passed += 1;

    results.push({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      output: actual,
      passed: matched,
      verdict: caseVerdict,
    });
    caseVerdicts.push(caseVerdict);

    if (!matched) break;
  }

  return { results, caseVerdicts, passed };
};

exports.runSample = async (req, res) => {
  const { code, language, input } = req.body;
  const problem = await Problem.findById(req.params.id);
  if (!problem) return res.status(404).json({ message: "Problem not found" });

  const sampleCases = input
    ? [{ input, expectedOutput: problem.sampleOutput || "" }]
    : problem.sampleCases?.length
      ? problem.sampleCases
      : [
          {
            input: problem.sampleInput || "",
            expectedOutput: problem.sampleOutput || "",
          },
        ];

  const { results, passed } = await runCases(
    sampleCases,
    code,
    language,
    problem.timeLimit || 1000,
  );

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
    verdict: VERDICTS.ACCEPTED,
  });

  const { results, caseVerdicts, passed } = await runCases(
    hiddenCases,
    code,
    language,
    problem.timeLimit || 1000,
  );

  const verdict = resolveSubmissionVerdict(caseVerdicts);

  const submission = await Submission.create({
    userId: req.user._id,
    problemId: problem._id,
    code,
    language,
    verdict,
    results,
  });

  const accepted = verdict === VERDICTS.ACCEPTED;
  const newlySolved = accepted && !alreadySolved;

  res.json({
    status: "submit",
    passed,
    total: hiddenCases.length,
    verdict,
    accepted,
    newlySolved,
    submissionId: submission._id,
    results,
  });
};

exports.listMySubmissions = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (req.query.problemId) {
    filter.problemId = req.query.problemId;
  }
  if (req.query.verdict) {
    filter.verdict = req.query.verdict;
  }

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("problemId", "title difficulty slug")
      .select("-code")
      .lean(),
    Submission.countDocuments(filter),
  ]);

  res.json({
    submissions: submissions.map((s) => ({
      id: s._id,
      verdict: s.verdict,
      language: s.language,
      createdAt: s.createdAt,
      problem: s.problemId
        ? {
            id: s.problemId._id,
            title: s.problemId.title,
            difficulty: s.problemId.difficulty,
            slug: s.problemId.slug,
          }
        : null,
      passed: s.results?.filter((r) => r.passed).length || 0,
      total: s.results?.length || 0,
    })),
    page,
    limit,
    total,
  });
};

exports.getMySubmission = async (req, res) => {
  const submission = await Submission.findOne({
    _id: req.params.id,
    userId: req.user._id,
  })
    .populate("problemId", "title difficulty slug")
    .lean();

  if (!submission) {
    return res.status(404).json({ message: "Submission not found" });
  }

  res.json({
    submission: {
      id: submission._id,
      verdict: submission.verdict,
      language: submission.language,
      code: submission.code,
      results: submission.results,
      createdAt: submission.createdAt,
      problem: submission.problemId
        ? {
            id: submission.problemId._id,
            title: submission.problemId.title,
            difficulty: submission.problemId.difficulty,
            slug: submission.problemId.slug,
          }
        : null,
    },
  });
};