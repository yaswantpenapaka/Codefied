import { useEffect, useState } from "react";
import api from "../services/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const res = await api.get("/users/me");
      setProfile(res.data.user);
    };
    loadProfile();
  }, []);

  if (!profile) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-400">Handle</p>
          <p className="text-lg font-semibold">{profile.handle}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Email</p>
          <p className="text-lg font-semibold">{profile.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Role</p>
          <p className="text-lg font-semibold capitalize">{profile.role}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Problems solved</p>
          <p className="text-3xl font-bold">{profile.solvedCount}</p>
        </div>
      </div>
    </div>
  );
}
