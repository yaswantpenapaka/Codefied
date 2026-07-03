import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(identifier, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800"
      >
        <h2 className="text-2xl font-bold mb-1">Codefied</h2>
        <p className="text-gray-400 mb-2">
          Sign in to Codefied — an online judge platform for secure code
          execution, challenge solving, and AI-powered review.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Use your email or handle to continue. Solve problems, submit
          solutions, review code with AI, and check your rank on the
          leaderboard.
        </p>

        {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}

        <input
          className="w-full mb-3 p-3 rounded bg-gray-800 border border-gray-700"
          placeholder="Email or handle"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          className="w-full mb-4 p-3 rounded bg-gray-800 border border-gray-700"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-indigo-600 py-2 rounded font-semibold">
          Login
        </button>

        <p className="text-sm text-gray-400 mt-4">
          No account?{" "}
          <Link to="/register" className="text-indigo-400">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
