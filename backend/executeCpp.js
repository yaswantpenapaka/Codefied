const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const outputPath = path.join(__dirname, "outputs");
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath);
}

const executeCpp = async (filePath, inputFilePath) => {
  const JobId = path.basename(filePath).split(".")[0];
  const outPath = path.join(outputPath, `${JobId}.exe`);

  return new Promise((resolve, reject) => {
    exec(
      `g++ "${filePath}" -o "${outPath}" && "${outPath}" < "${inputFilePath}"`,
      {
        timeout: 10000,           // 10 seconds max (custom run)
        maxBuffer: 5 * 1024 * 1024 // 5MB output buffer
      },
      (error, stdout, stderr) => {
        if (error) {
          // Return useful info instead of rejecting (compile errors, runtime errors, etc.)
          return resolve({
            stdout,
            stderr,
            error: error.message || "Execution failed",
            exitCode: error.code || null,
            killed: !!error.killed,
            timedOut: error.signal === "SIGTERM" || error.code === "ETIMEDOUT"
          });
        }
        resolve({ stdout, stderr });
      }
    );
  });
};

module.exports = executeCpp;