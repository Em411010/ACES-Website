import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "@/services/api";

interface User {
  _id: string;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  studentNumber?: string;
  section?: string;
  yearLevel?: number;
  avatar?: string;
  roleId?: {
    _id: string;
    name: string;
    color: string;
    position: number;
    permissions: string[];
  };
  isActive: boolean;
  profileUpdatePending: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<string>; // returns pendingId
  verifyOtp: (pendingId: string, code: string) => Promise<void>;
  logout: () => void;
  dismissProfileUpdate: () => Promise<void>;
  notifyProfileUpdate: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentNumber: string;
  section?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing session
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("accessToken");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    setUser(data.user);
  }

  async function register(payload: RegisterData): Promise<string> {
    const { data } = await api.post("/auth/register", payload);
    return data.pendingId as string;
  }

  async function verifyOtp(pendingId: string, code: string) {
    const { data } = await api.post("/auth/verify-otp", { pendingId, code });
    localStorage.setItem("accessToken", data.accessToken);
    setUser(data.user);
  }

  function logout() {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("accessToken");
    setUser(null);
  }

  async function dismissProfileUpdate() {
    await api.post("/users/dismiss-profile-update");
    setUser((u) => (u ? { ...u, profileUpdatePending: false } : null));
  }

  async function notifyProfileUpdate() {
    await api.post("/users/notify-profile-update");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout, dismissProfileUpdate, notifyProfileUpdate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
