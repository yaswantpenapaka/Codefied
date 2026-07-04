import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="font-semibold text-white">
          Codefied
        </Link>
        <Link to="/problems" className="text-gray-300 hover:text-white">
          Problems
        </Link>
        <Link to="/coderunner" className="text-gray-300 hover:text-white">
          Code Runner
        </Link>
        <Link to="/profile" className="text-gray-300 hover:text-white">
          Profile
        </Link>
        <Link to="/leaderboard" className="text-gray-300 hover:text-white">
          Leaderboard
        </Link>
        <Link to="/submissions" className="text-gray-300 hover:text-white">
          Submissions
        </Link>
        {user?.role === "admin" && (
          <Link
            to="/dashboard/add-problem"
            className="text-gray-300 hover:text-white"
          >
            Add Problem
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{user?.handle}</span>
        <button
          onClick={handleLogout}
          className="bg-red-600 px-3 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
