const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },
  code: { type: String, required: true },
  language: { type: String, required: true },
  verdict: { type: String, default: "pending" },
  runtime: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  results: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Submission", submissionSchema);