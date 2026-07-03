import { useEffect, useState } from "react";
import api from "../services/api";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const res = await api.get("/users/leaderboard");
      setLeaderboard(res.data.leaderboard);
    };
    loadLeaderboard();
  }, []);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-4">Leaderboard</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 bg-gray-950 px-6 py-4 text-gray-400 text-sm font-semibold">
          <span className="col-span-1">Rank</span>
          <span className="col-span-4">Handle</span>
          <span className="col-span-5">Email</span>
          <span className="col-span-2 text-right">Solved</span>
        </div>
        {leaderboard.map((user, index) => (
          <div
            key={user.userId}
            className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-gray-800 text-sm"
          >
            <span className="col-span-1 text-gray-300">{index + 1}</span>
            <span className="col-span-4">{user.handle}</span>
            <span className="col-span-5 text-gray-400 truncate">
              {user.email}
            </span>
            <span className="col-span-2 text-right text-gray-100">
              {user.solvedCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
