import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = async () => {
    const me = await api.get("/auth/me");
    setUser(me.data.user);
    return me.data.user;
  };

  const restoreSession = async () => {
    try {
      await loadCurrentUser();
    } catch {
      try {
        await api.post("/auth/refresh");
        await loadCurrentUser();
      } catch {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    restoreSession().finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post("/auth/login", { identifier, password });
    try {
      await loadCurrentUser();
    } catch {
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (handle, email, password, confirmPassword) => {
    const res = await api.post("/auth/register", {
      handle,
      email,
      password,
      confirmPassword,
    });
    try {
      await loadCurrentUser();
    } catch {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);