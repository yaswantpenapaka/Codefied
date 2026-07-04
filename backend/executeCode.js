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

const executeCode = async (code, input = "", language, runTimeoutMs = 10000) => {
  const compileTimeoutMs = COMPILE_TIMEOUT_MS;
  const jobId = uuid();
  const workDir = path.join(os.tmpdir(), "coderunner", jobId);
  fs.mkdirSync(workDir, { recursive: true });

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

  fs.writeFileSync(sourceFile, code, "utf8");

  try {
    let result;
    switch (language) {
      case "cpp": {
        const compileResult = markCompileTimeout(
          await executeProcess(
            "g++",
            [sourceFile, "-o", executableFile],
            workDir,
            "",
            compileTimeoutMs,
            "Compilation timed out",
          ),
        );
        if (compileResult.exitCode !== 0 || compileResult.timedOut) {
          result = {
            stdout: compileResult.stdout,
            stderr: compileResult.stderr || compileResult.error,
            error: compileResult.error,
            exitCode: compileResult.exitCode,
            timedOut: compileResult.timedOut,
            phase: compileResult.phase,
          };
          break;
        }
        result = await executeProcess(
          executableFile,
          [],
          workDir,
          input,
          runTimeoutMs,
          "Execution timed out",
        );
        break;
      }
      case "c": {
        const compileResult = markCompileTimeout(
          await executeProcess(
            "gcc",
            [sourceFile, "-o", executableFile],
            workDir,
            "",
            compileTimeoutMs,
            "Compilation timed out",
          ),
        );
        if (compileResult.exitCode !== 0 || compileResult.timedOut) {
          result = {
            stdout: compileResult.stdout,
            stderr: compileResult.stderr || compileResult.error,
            error: compileResult.error,
            exitCode: compileResult.exitCode,
            timedOut: compileResult.timedOut,
            phase: compileResult.phase,
          };
          break;
        }
        result = await executeProcess(
          executableFile,
          [],
          workDir,
          input,
          runTimeoutMs,
          "Execution timed out",
        );
        break;
      }
      case "java": {
        const compileResult = markCompileTimeout(
          await executeProcess(
            "javac",
            ["-d", workDir, sourceFile],
            workDir,
            "",
            compileTimeoutMs,
            "Compilation timed out",
          ),
        );
        if (compileResult.exitCode !== 0 || compileResult.timedOut) {
          result = {
            stdout: compileResult.stdout,
            stderr: compileResult.stderr || compileResult.error,
            error: compileResult.error,
            exitCode: compileResult.exitCode,
            timedOut: compileResult.timedOut,
            phase: compileResult.phase,
          };
          break;
        }
        result = await executeProcess(
          "java",
          ["-cp", workDir, "Main"],
          workDir,
          input,
          runTimeoutMs,
          "Execution timed out",
        );
        break;
      }
      case "python": {
        result = await executeProcess(
          process.platform === "win32" ? "python" : "python3",
          [sourceFile],
          workDir,
          input,
          runTimeoutMs,
          "Execution timed out",
        );
        break;
      }
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
    return result;
  } finally {
    await cleanupDirectory(workDir);
  }
};

module.exports = executeCode;
