const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const dirInputs = path.join(__dirname, "inputs");
if (!fs.existsSync(dirInputs)) {
  fs.mkdirSync(dirInputs);
}

const generateInputFile = (input) => {
  const JobId = uuid();
  const inputFilename = `${JobId}.txt`;
  const inputFilePath = path.join(dirInputs, inputFilename);
  fs.writeFileSync(inputFilePath, input != null ? input : ""); // safe for missing input
  return inputFilePath;
};

module.exports = generateInputFile;