// v1 sandbox: child processes run in the same host/container.
// v2 roadmap: isolate each submission in a dedicated container.
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const { v4: uuid } = require("uuid");

const COMPILE_TIMEOUT_MS =
  Number(process.env.COMPILE_TIMEOUT_MS) || 15000;

const executeProcess = (command, args, cwd, input, timeoutMs, timeoutMessage) => {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
      const message = timeoutMessage || "Execution timed out";
      resolve({
        stdout,
        stderr: stderr || message,
        error: message,
        exitCode: null,
        timedOut: true,
      });
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: stderr || error.message,
        error: error.message,
        exitCode: null,
        timedOut: false,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        error: code === 0 ? null : "Execution failed",
        exitCode: code,
        timedOut,
      });
    });

    if (input !== undefined && input !== null) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
};

const cleanupDirectory = async (dir) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      if (err.code === "EPERM" || err.code === "EBUSY") {
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
      throw err;
    }
  }
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (_) {
    // best-effort cleanup only
  }
};

const markCompileTimeout = (result) => {
  if (result.timedOut) {
    result.error = "Compilation timed out";
    result.stderr = result.stderr || "Compilation timed out";
    result.phase = "compile";
  }
  return result;
};

const toCompileFailure = (compileResult) => ({
  stdout: compileResult.stdout,
  stderr: compileResult.stderr || compileResult.error,
  error: compileResult.error,
  exitCode: compileResult.exitCode,
  timedOut: compileResult.timedOut,
  phase: compileResult.phase,
});

const getJobPaths = (workDir, language) => {
  const sourceFile =
    language === "cpp"
      ? path.join(workDir, "main.cpp")
      : language === "c"
        ? path.join(workDir, "main.c")
        : language === "java"
          ? path.join(workDir, "Main.java")
          : path.join(workDir, "main.py");
  const executableFile = path.join(
    workDir,
    process.platform === "win32" ? "main.exe" : "main.out",
  );
  return { sourceFile, executableFile };
};

const compileJob = async (workDir, language, compileTimeoutMs) => {
  const { sourceFile, executableFile } = getJobPaths(workDir, language);

  switch (language) {
    case "cpp":
      return markCompileTimeout(
        await executeProcess(
          "g++",
          [sourceFile, "-o", executableFile],
          workDir,
          "",
          compileTimeoutMs,
          "Compilation timed out",
        ),
      );
    case "c":
      return markCompileTimeout(
        await executeProcess(
          "gcc",
          [sourceFile, "-o", executableFile],
          workDir,
          "",
          compileTimeoutMs,
          "Compilation timed out",
        ),
      );
    case "java":
      return markCompileTimeout(
        await executeProcess(
          "javac",
          ["-d", workDir, sourceFile],
          workDir,
          "",
          compileTimeoutMs,
          "Compilation timed out",
        ),
      );
    case "python":
      return { exitCode: 0, timedOut: false };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

const runCompiledJob = async (
  workDir,
  language,
  input,
  runTimeoutMs,
  executableFile,
) => {
  switch (language) {
    case "cpp":
    case "c":
      return executeProcess(
        executableFile,
        [],
        workDir,
        input,
        runTimeoutMs,
        "Execution timed out",
      );
    case "java":
      return executeProcess(
        "java",
        ["-cp", workDir, "Main"],
        workDir,
        input,
        runTimeoutMs,
        "Execution timed out",
      );
    case "python": {
      const { sourceFile } = getJobPaths(workDir, language);
      return executeProcess(
        process.platform === "win32" ? "python" : "python3",
        [sourceFile],
        workDir,
        input,
        runTimeoutMs,
        "Execution timed out",
      );
    }
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

const executeCode = async (code, input = "", language, runTimeoutMs = 10000) => {
  const [result] = await executeCodeCases(
    code,
    [input],
    language,
    runTimeoutMs,
  );
  return result;
};

const executeCodeCases = async (
  code,
  inputs,
  language,
  runTimeoutMs = 10000,
) => {
  const compileTimeoutMs = COMPILE_TIMEOUT_MS;
  const jobId = uuid();
  const workDir = path.join(os.tmpdir(), "coderunner", jobId);
  fs.mkdirSync(workDir, { recursive: true });

  const { sourceFile, executableFile } = getJobPaths(workDir, language);
  fs.writeFileSync(sourceFile, code, "utf8");

  try {
    const compileResult = await compileJob(workDir, language, compileTimeoutMs);
    if (compileResult.exitCode !== 0 || compileResult.timedOut) {
      const failure = toCompileFailure(compileResult);
      return [failure];
    }

    const results = [];
    for (const input of inputs) {
      const result = await runCompiledJob(
        workDir,
        language,
        input,
        runTimeoutMs,
        executableFile,
      );
      results.push(result);
    }
    return results;
  } finally {
    await cleanupDirectory(workDir);
  }
};

module.exports = executeCode;
module.exports.executeCodeCases = executeCodeCases;
