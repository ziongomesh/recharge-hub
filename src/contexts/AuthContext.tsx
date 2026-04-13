import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, setToken, removeToken, type User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; phone: string; cpf: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUser(u: any): User | null {
  if (!u) return null;
  return {
    ...u,
    balance: Number(u.balance) || 0,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    try {
      const { user } = await authApi.me();
      setUser(normalizeUser(user));
    } catch {
      setUser(null);
      removeToken();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await authApi.login({ email, password });
    setToken(token);
    setUser(normalizeUser(user));
    navigate("/");
  };

  const register = async (data: { username: string; email: string; password: string; phone: string; cpf: string }) => {
    const { token, user } = await authApi.register(data);
    setToken(token);
    setUser(normalizeUser(user));
    navigate("/");
  };

  const logout = () => {
    removeToken();
    setUser(null);
    navigate("/login");
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
