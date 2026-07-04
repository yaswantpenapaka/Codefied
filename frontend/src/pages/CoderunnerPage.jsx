import { useState } from "react";
import ReactMarkdown from "react-markdown";
import api from "../services/api";
import CodeEditor from "../components/CodeEditor";

const LANGUAGES = [
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "Python", value: "python" },
];

const DEFAULT_CODE = {
  c: `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  python: `print("Hello, World!")`,
};

export default function CoderunnerPage() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE.cpp);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiReview, setAiReview] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleLanguageChange = (e) => {
    const nextLanguage = e.target.value;
    setLanguage(nextLanguage);
    setCode(DEFAULT_CODE[nextLanguage]);
    setOutput(null);
    setError("");
  };

  const handleRun = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/compiler/run", { language, code, input });
      setOutput(res.data.output);
    } catch (err) {
      setError(err?.response?.data?.message || "Run failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAiReview = async () => {
    if (!code.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post("/compiler/aiReview", { code });
      setAiReview(res.data.aiReview);
    } catch {
      setAiReview("AI review failed.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Code Runner</h1>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="bg-gray-800 p-2 rounded"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <CodeEditor language={language} value={code} onChange={setCode} />
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleRun}
              className="bg-indigo-600 px-4 py-2 rounded"
            >
              Run
            </button>
            <button
              onClick={handleAiReview}
              className="bg-violet-600 px-4 py-2 rounded"
            >
              AI Review
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Input</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-32 bg-gray-900 border border-gray-800 rounded p-3"
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Output</h3>
            <pre className="w-full h-48 bg-gray-900 border border-gray-800 rounded p-3 overflow-auto text-sm">
              {loading
                ? "Running..."
                : error ||
                  (output ? output.stdout || output.stderr : "No output yet")}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">AI Review</h3>
            <div className="bg-gray-900 border border-gray-800 rounded p-3 min-h-32">
              {aiLoading ? (
                "Reviewing..."
              ) : (
                <ReactMarkdown>{aiReview || "No review yet."}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
