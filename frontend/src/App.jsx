import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const LANGUAGES = [
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "Python", value: "python" }
];

const DEFAULT_CODE = {
  c: `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  python: `print("Hello, World!")`
};

export default function App() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE.cpp);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // AI Review states
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Update code when language changes
const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang]);   // Direct update - no effect needed
  };

  // Run Code with custom input
  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch("http://localhost:3000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, input }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setOutput(data.output);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // AI Code Review
  const handleAiReview = async () => {
    if (!code.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiReview(null);

    try {
      const response = await fetch("http://localhost:3000/aiReview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setAiReview(data.aiReview);
    } catch (err) {
      setAiError(err.message || "Failed to get AI review.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">⚡</span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Code<span className="text-indigo-400">Runner</span>
          </h1>
          <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-950 text-indigo-400 rounded-full font-mono tracking-wider">v1</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">localhost:3000 • AI Powered</span>
      </header>

      <main className="flex flex-col flex-1 gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="language-select" className="text-sm text-gray-400 font-medium">
              Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={handleLanguageChange}
              className="bg-gray-800 border border-gray-600 text-gray-100 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* AI Review Button */}
            <button
              onClick={handleAiReview}
              disabled={aiLoading || !code.trim()}
              aria-label="Get AI code review"
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200 shadow-lg
                ${aiLoading 
                  ? "bg-violet-700 cursor-not-allowed opacity-70" 
                  : "bg-violet-600 hover:bg-violet-500 active:scale-95 cursor-pointer"}`}
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Reviewing...
                </>
              ) : (
                <>✨ AI Review</>
              )}
            </button>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={loading}
              aria-label="Run code with custom input"
              className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 shadow-lg
                ${loading 
                  ? "bg-indigo-700 cursor-not-allowed opacity-70" 
                  : "bg-indigo-600 hover:bg-indigo-500 active:scale-95 cursor-pointer"}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Running...
                </>
              ) : (
                <><span>▶</span> Run Code</>
              )}
            </button>
          </div>
        </div>

        {/* Editor + Right Panel */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-[500px]">
          {/* Code Editor */}
          <div className="flex flex-col flex-1 min-h-[400px]">
            <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-t-lg px-4 py-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Editor</span>
              <span className="text-xs text-gray-500 font-mono">
                main.{language === "python" ? "py" : language === "java" ? "java" : language}
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              aria-label="Code editor"
              className="flex-1 w-full bg-gray-900 text-green-300 font-mono text-sm p-4 border border-t-0 border-gray-700 rounded-b-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              style={{ minHeight: "400px", tabSize: 4 }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.target.selectionStart;
                  const end = e.target.selectionEnd;
                  const newCode = code.substring(0, start) + "    " + code.substring(end);
                  setCode(newCode);
                  setTimeout(() => {
                    e.target.selectionStart = e.target.selectionEnd = start + 4;
                  }, 0);
                }
              }}
            />
          </div>

          {/* Right Column: Custom Input + Output */}
          <div className="flex flex-col flex-1 gap-4 min-h-[400px]">
            {/* Custom Input */}
            <div className="flex flex-col flex-1 min-h-[140px]">
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-t-lg px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Custom Input (stdin)</span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input for your program (one value per line)..."
                spellCheck={false}
                aria-label="Custom input for stdin"
                className="flex-1 w-full bg-gray-900 text-gray-200 font-mono text-sm p-3 border border-t-0 border-gray-700 rounded-b-lg resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ minHeight: "100px" }}
              />
            </div>

            {/* Output Panel */}
            <div className="flex flex-col flex-1 min-h-[260px]">
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-t-lg px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Output</span>
                {output && <span className="ml-auto text-xs text-green-400 font-mono">✓ Done</span>}
                {error && <span className="ml-auto text-xs text-red-400 font-mono">✗ Failed</span>}
              </div>
              <div className="flex-1 bg-gray-900 border border-t-0 border-gray-700 rounded-b-lg p-4 font-mono text-sm overflow-auto flex flex-col gap-4">
                {!loading && !output && !error && (
                  <p className="text-gray-600 italic text-sm">Click <span className="text-indigo-400 font-semibold">Run Code</span> to execute with custom input.</p>
                )}
                {loading && (
                  <div className="flex items-center gap-3 text-gray-400">
                    <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Compiling and running...
                  </div>
                )}
                {error && (
                  <div className="bg-red-950 border border-red-700 rounded-md p-3">
                    <p className="text-red-400 font-semibold text-xs uppercase mb-1">Request Error</p>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
                {output?.stdout && (
                  <div>
                    <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-2">stdout</p>
                    <pre className="bg-gray-800 rounded-md p-3 text-green-300 whitespace-pre-wrap break-words text-sm leading-relaxed">{output.stdout}</pre>
                  </div>
                )}
                {output?.stderr && (
                  <div>
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-2">stderr</p>
                    <pre className="bg-gray-800 rounded-md p-3 text-red-300 whitespace-pre-wrap break-words text-sm leading-relaxed">{output.stderr}</pre>
                  </div>
                )}
                {output && !output.stdout && !output.stderr && (
                  <p className="text-gray-500 italic text-sm">Program finished with no output.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Code Review Section */}
        <section aria-labelledby="ai-review-heading" className="mt-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 id="ai-review-heading" className="text-sm font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span>✨</span> AI Code Review
            </h2>
            {aiReview && (
              <button 
                onClick={() => setAiReview(null)} 
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 min-h-[180px]">
            {!aiReview && !aiLoading && !aiError && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-gray-500 text-sm">Click <span className="text-violet-400 font-medium">AI Review</span> to get intelligent feedback.</p>
              </div>
            )}

            {aiLoading && (
              <div className="flex items-center gap-3 text-gray-400 py-4">
                <svg className="animate-spin h-5 w-5 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Analyzing your code with Gemini...</span>
              </div>
            )}

            {aiError && (
              <div className="bg-red-950 border border-red-700 rounded-lg p-4">
                <p className="text-red-400 text-sm font-medium">AI Review failed</p>
                <p className="text-red-300 text-sm mt-1">{aiError}</p>
              </div>
            )}

            {aiReview && (
              <article className="prose prose-invert prose-sm max-w-none text-gray-200">
                <ReactMarkdown>{aiReview}</ReactMarkdown>
              </article>
            )}
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5 px-1">Powered by Google Gemini • Responses may vary</p>
        </section>
      </main>
    </div>
  );
}