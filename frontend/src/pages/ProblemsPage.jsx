import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { deriveProblemStats } from "../utils/problemStats";

const difficultyStyles = {
  Easy: "bg-green-900/40 text-green-300 border-green-700",
  Medium: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  Hard: "bg-red-900/40 text-red-300 border-red-700",
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState({ solved: 0, total: 0, open: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/problems");
      const problemsList = res.data.problems || [];
      setProblems(problemsList);
      setStats(
        deriveProblemStats(
          problemsList,
          res.data.solvedCount,
          res.data.totalCount,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  if (loading) return <div className="p-6">Loading problems...</div>;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Problems</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track your progress — solved problems show a green check.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-700 text-green-300 font-semibold">
            ✓ Solved: {stats.solved}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300">
            Open: {stats.open}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400">
            Total: {stats.total}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {problems.map((problem) => (
          <Link
            key={problem._id}
            to={`/problems/${problem._id}`}
            className={`block rounded-xl p-4 border-2 transition-colors ${
              problem.solved
                ? "bg-green-950/40 border-green-500 hover:border-green-400"
                : "bg-gray-900 border-gray-800 hover:border-indigo-500"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-lg">{problem.title}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border capitalize ${
                      difficultyStyles[problem.difficulty] ||
                      "bg-gray-800 text-gray-300 border-gray-700"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </div>

                {problem.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {problem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0">
                {problem.solved ? (
                  <span className="inline-flex items-center gap-1.5 text-green-400 font-bold text-sm bg-green-900/50 border border-green-600 px-3 py-1.5 rounded-full">
                    <span className="text-lg leading-none">✓</span> Solved
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 border border-gray-700 px-3 py-1.5 rounded-full">
                    Open
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}