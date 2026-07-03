import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-6">Welcome, {user?.handle}</p>

      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/problems"
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500"
        >
          <h2 className="text-xl font-semibold mb-2">Problems</h2>
          <p className="text-gray-400">
            Solve coding problems with run and submit modes.
          </p>
        </Link>

        <Link
          to="/coderunner"
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500"
        >
          <h2 className="text-xl font-semibold mb-2">Code Runner</h2>
          <p className="text-gray-400">
            Use the online compiler directly with AI review.
          </p>
        </Link>

        <Link
          to="/profile"
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500"
        >
          <h2 className="text-xl font-semibold mb-2">Profile</h2>
          <p className="text-gray-400">
            View your solved count, handle, and email.
          </p>
        </Link>

        <Link
          to="/leaderboard"
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500"
        >
          <h2 className="text-xl font-semibold mb-2">Leaderboard</h2>
          <p className="text-gray-400">See top solvers on Codefied.</p>
        </Link>

        {user?.role === "admin" && (
          <Link
            to="/dashboard/add-problem"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500"
          >
            <h2 className="text-xl font-semibold mb-2">Add Problem</h2>
            <p className="text-gray-400">
              Create new problems and add sample/hidden testcases.
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
