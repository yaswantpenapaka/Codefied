import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Editor from "@monaco-editor/react";
import api from "../services/api";

export default function ProblemDetailPage() {
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await api.get(`/problems/${problemId}`);
      setProblem(res.data.problem);
      setCode(res.data.problem.starterCode || "");
      setInput(res.data.problem.sampleInput || "");
    };
    load();
  }, [problemId]);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/submissions/run/${problemId}`, {
        code,
        language,
        input,
      });
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/submissions/submit/${problemId}`, {
        code,
        language,
      });
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (!problem) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 grid lg:grid-cols-2 gap-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h1 className="text-2xl font-bold mb-3">{problem.title}</h1>
        <p className="text-sm text-gray-400 mb-3">{problem.difficulty}</p>
        <div className="prose prose-invert max-w-none text-sm">
          <ReactMarkdown>{problem.description}</ReactMarkdown>
        </div>
        <div className="mt-4 text-sm text-gray-400 space-y-1">
          <p>
            <strong>Constraints:</strong> {problem.constraints}
          </p>
          <p>
            <strong>Time Limit:</strong> {problem.timeLimit}ms
          </p>
          <p>
            <strong>Memory Limit:</strong> {problem.memoryLimit}MB
          </p>
          <div>
            <strong>Sample Test Cases:</strong>
            {problem.sampleCases && problem.sampleCases.length ? (
              problem.sampleCases.map((sample, index) => (
                <div key={index} className="mt-3 bg-gray-800 rounded p-3">
                  <p className="text-xs text-gray-400">Case {index + 1}</p>
                  <p className="mt-2 text-sm">
                    <strong>Input:</strong>
                  </p>
                  <pre className="bg-gray-900 p-2 rounded text-xs">
                    {sample.input}
                  </pre>
                  <p className="mt-2 text-sm">
                    <strong>Expected Output:</strong>
                  </p>
                  <pre className="bg-gray-900 p-2 rounded text-xs">
                    {sample.expectedOutput}
                  </pre>
                </div>
              ))
            ) : (
              <>
                <p className="mt-2 text-sm">
                  <strong>Input:</strong>
                </p>
                <pre className="bg-gray-800 p-2 rounded text-xs">
                  {problem.sampleInput}
                </pre>
                <p className="mt-2 text-sm">
                  <strong>Expected Output:</strong>
                </p>
                <pre className="bg-gray-800 p-2 rounded text-xs">
                  {problem.sampleOutput}
                </pre>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>

          <button
            onClick={handleRun}
            className="bg-indigo-600 px-4 py-2 rounded"
          >
            Run Sample
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Submit
          </button>
        </div>

        <div className="rounded-lg overflow-hidden border border-gray-800">
          <Editor
            height="420px"
            language={
              language === "cpp"
                ? "cpp"
                : language === "c"
                  ? "c"
                  : language === "java"
                    ? "java"
                    : "python"
            }
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Custom Input</h3>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-24 bg-gray-900 border border-gray-800 rounded p-3"
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Result</h3>
          {loading ? (
            <p>Running...</p>
          ) : (
            result && (
              <div className="text-sm">
                <p>
                  <strong>Status:</strong> {result.status}
                </p>
                <p>
                  <strong>Passed:</strong> {result.passed} / {result.total}
                </p>
                {result.results?.map((r, i) => (
                  <div key={i} className="mt-2 border-t border-gray-800 pt-2">
                    <p>
                      Case {i + 1}: {r.passed ? "Passed" : "Failed"}
                    </p>
                    <pre className="whitespace-pre-wrap text-xs text-gray-400">
                      {r.output}
                    </pre>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
