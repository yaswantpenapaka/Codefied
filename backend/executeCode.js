const { exec } = require("child_process");
const { v4: uuid } = require("uuid");

const executeCode = async (code, input = "", language) => {
  const jobId = uuid();
  const workDir = `/tmp/coderunner/${jobId}`;

  let runCommand = "";

  switch (language) {
    case "cpp":
      runCommand = `cat > ${workDir}/main.cpp << 'EOF'
${code}
EOF
g++ ${workDir}/main.cpp -o ${workDir}/main && ${workDir}/main`;
      break;

    case "c":
      runCommand = `cat > ${workDir}/main.c << 'EOF'
${code}
EOF
gcc ${workDir}/main.c -o ${workDir}/main && ${workDir}/main`;
      break;

    case "java":
      runCommand = `cat > ${workDir}/Main.java << 'EOF'
${code}
EOF
javac -d ${workDir} ${workDir}/Main.java && java -cp ${workDir} Main`;
      break;

    case "python":
      runCommand = `cat > ${workDir}/main.py << 'EOF'
${code}
EOF
python3 ${workDir}/main.py`;
      break;

    default:
      throw new Error(`Unsupported language: ${language}`);
  }

  const fullCommand = `mkdir -p ${workDir} && echo '${input.replace(/'/g, "'\\''")}' | ${runCommand} && rm -rf ${workDir}`;

  return new Promise((resolve) => {
    exec(fullCommand, { 
      timeout: 10000,
      shell: true 
    }, (error, stdout, stderr) => {
      if (error) {
        return resolve({
          stdout: stdout || "",
          stderr: stderr || error.message,
          error: error.message || "Execution failed",
          exitCode: error.code,
          timedOut: error.signal === "SIGTERM" || error.code === "ETIMEDOUT"
        });
      }
      resolve({ stdout, stderr });
    });
  });
};

module.exports = executeCode;