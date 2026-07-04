const VERDICTS = {
  ACCEPTED: "accepted",
  WRONG_ANSWER: "wrong-answer",
  TIME_LIMIT_EXCEEDED: "time-limit-exceeded",
  COMPILE_ERROR: "compile-error",
  RUNTIME_ERROR: "runtime-error",
  PENDING: "pending",
};

const normalizeOutput = (stdout, stderr) =>
  (stdout || stderr || "").trim();

const resolveCaseVerdict = (output, expectedOutput) => {
  if (
    output.timedOut &&
    (output.error === "Compilation timed out" || output.phase === "compile")
  ) {
    return VERDICTS.COMPILE_ERROR;
  }

  if (output.timedOut || output.error === "Execution timed out") {
    return VERDICTS.TIME_LIMIT_EXCEEDED;
  }

  if (output.exitCode !== 0 && output.exitCode !== null) {
    const stderr = output.stderr || "";
    if (
      stderr.includes("error:") ||
      stderr.includes("Error") ||
      stderr.includes("syntax")
    ) {
      return VERDICTS.COMPILE_ERROR;
    }
    return VERDICTS.RUNTIME_ERROR;
  }

  const actual = normalizeOutput(output.stdout, output.stderr);
  if (actual === expectedOutput.trim()) {
    return VERDICTS.ACCEPTED;
  }

  return VERDICTS.WRONG_ANSWER;
};

const resolveSubmissionVerdict = (caseVerdicts) => {
  if (caseVerdicts.every((v) => v === VERDICTS.ACCEPTED)) {
    return VERDICTS.ACCEPTED;
  }
  return caseVerdicts.find((v) => v !== VERDICTS.ACCEPTED) || VERDICTS.WRONG_ANSWER;
};

module.exports = {
  VERDICTS,
  resolveCaseVerdict,
  resolveSubmissionVerdict,
};