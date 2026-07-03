import { useState } from "react";
import api from "../services/api";

export default function AddProblemPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    constraints: "",
    timeLimit: 1000,
    memoryLimit: 256,
    tags: "",
    sampleCases: [{ input: "", expectedOutput: "" }],
    hiddenCases: [{ input: "", expectedOutput: "" }],
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSampleCaseChange = (index, field, value) => {
    const sampleCases = [...form.sampleCases];
    sampleCases[index][field] = value;
    setForm({ ...form, sampleCases });
  };

  const addSampleCase = () => {
    setForm({
      ...form,
      sampleCases: [...form.sampleCases, { input: "", expectedOutput: "" }],
    });
  };

  const removeSampleCase = (index) => {
    const sampleCases = form.sampleCases.filter((_, i) => i !== index);
    setForm({
      ...form,
      sampleCases: sampleCases.length
        ? sampleCases
        : [{ input: "", expectedOutput: "" }],
    });
  };

  const handleHiddenCaseChange = (index, field, value) => {
    const hiddenCases = [...form.hiddenCases];
    hiddenCases[index][field] = value;
    setForm({ ...form, hiddenCases });
  };

  const addHiddenCase = () => {
    setForm({
      ...form,
      hiddenCases: [...form.hiddenCases, { input: "", expectedOutput: "" }],
    });
  };

  const removeHiddenCase = (index) => {
    const hiddenCases = form.hiddenCases.filter((_, i) => i !== index);
    setForm({
      ...form,
      hiddenCases: hiddenCases.length
        ? hiddenCases
        : [{ input: "", expectedOutput: "" }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/problems", {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setMessage("Problem created successfully.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to create problem");
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Add Problem</h1>

      {message && <div className="mb-4 text-sm text-green-400">{message}</div>}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-6"
      >
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-800"
          placeholder="Title"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full h-40 p-3 rounded bg-gray-800"
          placeholder="Description"
        />
        <select
          name="difficulty"
          value={form.difficulty}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-800"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input
          name="constraints"
          value={form.constraints}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-800"
          placeholder="Constraints"
        />
        <input
          name="timeLimit"
          value={form.timeLimit}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-800"
          placeholder="Time Limit (ms)"
        />
        <p className="text-xs text-gray-400">1000 means 1000ms time limit.</p>
        <input
          name="memoryLimit"
          value={form.memoryLimit}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-800"
          placeholder="Memory Limit (MB)"
        />
        <p className="text-xs text-gray-400">256 means 256MB memory limit.</p>
        <input
          name="tags"
          value={form.tags}
          onChange={handleChange}
          className="w-full p-3 rounded bg-gray-800"
          placeholder="Tags (comma separated)"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Sample Test Cases</p>
            <button
              type="button"
              onClick={addSampleCase}
              className="text-indigo-400 text-sm"
            >
              Add Sample Case
            </button>
          </div>
          {form.sampleCases.map((sample, index) => (
            <div key={index} className="space-y-2 bg-gray-800 p-4 rounded">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-300">
                  Sample case {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeSampleCase(index)}
                  className="text-red-400 text-xs"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={sample.input}
                onChange={(e) =>
                  handleSampleCaseChange(index, "input", e.target.value)
                }
                className="w-full h-20 p-3 rounded bg-gray-900 border border-gray-700"
                placeholder="Sample input"
              />
              <textarea
                value={sample.expectedOutput}
                onChange={(e) =>
                  handleSampleCaseChange(
                    index,
                    "expectedOutput",
                    e.target.value,
                  )
                }
                className="w-full h-20 p-3 rounded bg-gray-900 border border-gray-700"
                placeholder="Sample output"
              />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Hidden Test Cases</p>
            <button
              type="button"
              onClick={addHiddenCase}
              className="text-indigo-400 text-sm"
            >
              Add Hidden Case
            </button>
          </div>
          {form.hiddenCases.map((hidden, index) => (
            <div key={index} className="space-y-2 bg-gray-800 p-4 rounded">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-300">
                  Hidden case {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeHiddenCase(index)}
                  className="text-red-400 text-xs"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={hidden.input}
                onChange={(e) =>
                  handleHiddenCaseChange(index, "input", e.target.value)
                }
                className="w-full h-20 p-3 rounded bg-gray-900 border border-gray-700"
                placeholder="Hidden input"
              />
              <textarea
                value={hidden.expectedOutput}
                onChange={(e) =>
                  handleHiddenCaseChange(
                    index,
                    "expectedOutput",
                    e.target.value,
                  )
                }
                className="w-full h-20 p-3 rounded bg-gray-900 border border-gray-700"
                placeholder="Hidden output"
              />
            </div>
          ))}
        </div>

        <button className="bg-indigo-600 px-4 py-2 rounded">
          Create Problem
        </button>
      </form>
    </div>
  );
}
