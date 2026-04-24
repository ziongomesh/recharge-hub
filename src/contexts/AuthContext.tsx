import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, setToken, removeToken, type User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  adminVerified: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { username: string; email: string; password: string; phone: string; cpf: string }) => Promise<void>;
  verifyPin: (pin: string) => Promise<void>;
  setupPin: (pin: string, confirmPin: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUser(u: any): User | null {
  if (!u) return null;
  return { ...u, balance: Number(u.balance) || 0 };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminVerified, setAdminVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    try {
      const { user, adminVerified } = await authApi.me();
      setUser(normalizeUser(user));
      setAdminVerified(!!adminVerified);
    } catch {
      setUser(null);
      setAdminVerified(false);
      removeToken();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    let cancelled = false;
    const stopLoading = () => {
      if (!cancelled) setLoading(false);
    };

    if (token) {
      const timeoutId = window.setTimeout(stopLoading, 5000);
      refreshUser()
        .catch(() => undefined)
        .finally(() => {
          window.clearTimeout(timeoutId);
          stopLoading();
        });
    } else {
      stopLoading();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { token, user } = await authApi.login({ email, password });
    setToken(token);
    const normalized = normalizeUser(user) as User;
    setUser(normalized);
    setAdminVerified(false); // sempre força PIN ao logar
    if (normalized.role === "admin" || normalized.role === "mod") {
      navigate("/admin/pin");
    } else {
      navigate("/recargas");
    }
    return normalized;
  };

  const register = async (data: { username: string; email: string; password: string; phone: string; cpf: string }) => {
    const { token, user } = await authApi.register(data);
    setToken(token);
    setUser(normalizeUser(user));
    setAdminVerified(false);
    navigate("/recargas");
  };

  const verifyPin = async (pin: string) => {
    const { token, user } = await authApi.verifyPin(pin);
    setToken(token);
    setUser(normalizeUser(user));
    setAdminVerified(true);
    navigate("/admin");
  };

  const setupPin = async (pin: string, confirmPin: string) => {
    const { token, user } = await authApi.setupPin(pin, confirmPin);
    setToken(token);
    setUser(normalizeUser(user));
    setAdminVerified(true);
    navigate("/admin");
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setAdminVerified(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, adminVerified, login, register, verifyPin, setupPin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
