const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },
    constraints: { type: String, default: "" },
    timeLimit: { type: Number, default: 1000 },
    memoryLimit: { type: Number, default: 256 },
    tags: [{ type: String }],
    sampleCases: {
      type: [
        {
          input: { type: String, default: "" },
          expectedOutput: { type: String, default: "" },
        },
      ],
      default: [],
    },
    sampleInput: { type: String, default: "" },
    sampleOutput: { type: String, default: "" },
    starterCode: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Problem", problemSchema);
