import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/problems");
        setProblems(res.data.problems);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Loading problems...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Problems</h1>
      <div className="space-y-3">
        {problems.map((problem) => (
          <Link
            key={problem._id}
            to={`/problems/${problem._id}`}
            className={`block rounded-xl p-4 border transition-colors ${
              problem.solved
                ? "bg-green-900/20 border-green-700 hover:border-green-500"
                : "bg-gray-900 border-gray-800 hover:border-indigo-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{problem.title}</h2>
                <p className="text-sm text-gray-400">{problem.difficulty}</p>
              </div>
              <div className="flex items-center gap-2">
                {problem.solved ? (
                  <span className="text-sm text-green-400 font-semibold flex items-center gap-1">
                    ✓ Solved
                  </span>
                ) : (
                  <span className="text-sm text-indigo-400">Open</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
