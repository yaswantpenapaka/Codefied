import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const verdictStyles = {
  accepted: "text-green-400 bg-green-900/30 border-green-700",
  "wrong-answer": "text-red-400 bg-red-900/30 border-red-700",
  "time-limit-exceeded": "text-orange-400 bg-orange-900/30 border-orange-700",
  "compile-error": "text-yellow-400 bg-yellow-900/30 border-yellow-700",
  "runtime-error": "text-pink-400 bg-pink-900/30 border-pink-700",
  pending: "text-gray-400 bg-gray-800 border-gray-700",
};

const formatVerdict = (verdict) =>
  verdict
    ?.split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "Unknown";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/submissions/me");
        setSubmissions(res.data.submissions || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openDetail = async (id) => {
    const res = await api.get(`/submissions/me/${id}`);
    setSelected(res.data.submission);
  };

  if (loading) return <div className="p-6">Loading submissions...</div>;

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Submission History</h1>
      <p className="text-gray-400 text-sm mb-6">
        Your past runs and submits across all problems.
      </p>

      {submissions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
          No submissions yet.{" "}
          <Link to="/problems" className="text-indigo-400 hover:underline">
            Solve a problem
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold text-gray-400 border-b border-gray-800">
            <span className="col-span-4">Problem</span>
            <span className="col-span-2">Verdict</span>
            <span className="col-span-2">Language</span>
            <span className="col-span-2">Tests</span>
            <span className="col-span-2 text-right">When</span>
          </div>
          {submissions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => openDetail(s.id)}
              className="w-full grid grid-cols-12 gap-3 px-5 py-4 text-sm border-b border-gray-800 hover:bg-gray-800/50 text-left"
            >
              <span className="col-span-4 truncate">
                {s.problem ? (
                  <Link
                    to={`/problems/${s.problem.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-indigo-300 hover:underline"
                  >
                    {s.problem.title}
                  </Link>
                ) : (
                  "Unknown problem"
                )}
              </span>
              <span className="col-span-2">
                <span
                  className={`text-xs px-2 py-1 rounded border ${
                    verdictStyles[s.verdict] || verdictStyles.pending
                  }`}
                >
                  {formatVerdict(s.verdict)}
                </span>
              </span>
              <span className="col-span-2 capitalize text-gray-300">
                {s.language}
              </span>
              <span className="col-span-2 text-gray-400">
                {s.passed}/{s.total}
              </span>
              <span className="col-span-2 text-right text-gray-500 text-xs">
                {new Date(s.createdAt).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  {selected.problem?.title || "Submission"}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {formatVerdict(selected.verdict)} · {selected.language} ·{" "}
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <pre className="bg-gray-950 border border-gray-800 rounded p-4 text-xs overflow-x-auto mb-4">
              {selected.code}
            </pre>

            {selected.results?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Test results</h3>
                {selected.results.map((r, i) => (
                  <div
                    key={i}
                    className={`text-xs p-3 rounded border ${
                      r.passed
                        ? "border-green-800 bg-green-950/30"
                        : "border-red-800 bg-red-950/30"
                    }`}
                  >
                    <p className="font-semibold mb-1">
                      Case {i + 1}: {formatVerdict(r.verdict || (r.passed ? "accepted" : "wrong-answer"))}
                    </p>
                    {!r.passed && (
                      <>
                        <p className="text-gray-400">Expected:</p>
                        <pre className="bg-gray-950 p-2 rounded mb-1">{r.expectedOutput}</pre>
                        <p className="text-gray-400">Got:</p>
                        <pre className="bg-gray-950 p-2 rounded">{r.output}</pre>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}