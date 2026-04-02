import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { Navigate } from "react-router-dom";
import acesLogo from "@/assets/aces_logo.png";
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Loader2,
  Cpu,
  CircuitBoard,
  Zap,
  Microchip,
  Code,
  Server,
  Wifi,
  Shield,
  Target,
  Lightbulb,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  Network,
  Mail,
  RotateCcw,
} from "lucide-react";

/* ───────────────────────────────────────────
   Animated circuit-board SVG background
   ─────────────────────────────────────────── */
function CircuitBG() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <line x1="0" y1="80" x2="300" y2="80" stroke="#00BCD4" strokeWidth="1" opacity="0.15">
        <animate attributeName="opacity" values="0.05;0.2;0.05" dur="4s" repeatCount="indefinite" />
      </line>
      <line x1="350" y1="80" x2="600" y2="80" stroke="#00BCD4" strokeWidth="1" opacity="0.1" />
      <line x1="0" y1="200" x2="500" y2="200" stroke="#D4A017" strokeWidth="1" opacity="0.08">
        <animate attributeName="opacity" values="0.04;0.15;0.04" dur="5s" repeatCount="indefinite" />
      </line>
      <line x1="550" y1="200" x2="1200" y2="200" stroke="#00BCD4" strokeWidth="0.8" opacity="0.06" />
      <line x1="0" y1="350" x2="400" y2="350" stroke="#00BCD4" strokeWidth="1" opacity="0.12">
        <animate attributeName="opacity" values="0.06;0.18;0.06" dur="6s" repeatCount="indefinite" />
      </line>
      <line x1="450" y1="350" x2="900" y2="350" stroke="#D4A017" strokeWidth="0.8" opacity="0.08" />
      <line x1="0" y1="500" x2="350" y2="500" stroke="#D4A017" strokeWidth="1" opacity="0.1">
        <animate attributeName="opacity" values="0.05;0.15;0.05" dur="4.5s" repeatCount="indefinite" />
      </line>
      <line x1="700" y1="500" x2="1200" y2="500" stroke="#00BCD4" strokeWidth="0.8" opacity="0.06" />
      <line x1="0" y1="650" x2="250" y2="650" stroke="#00BCD4" strokeWidth="1" opacity="0.08" />
      <line x1="300" y1="650" x2="800" y2="650" stroke="#D4A017" strokeWidth="0.8" opacity="0.05">
        <animate attributeName="opacity" values="0.03;0.12;0.03" dur="7s" repeatCount="indefinite" />
      </line>
      <line x1="900" y1="120" x2="1200" y2="120" stroke="#00BCD4" strokeWidth="1" opacity="0.1" />
      <line x1="800" y1="450" x2="1200" y2="450" stroke="#D4A017" strokeWidth="0.8" opacity="0.07" />
      <line x1="200" y1="0" x2="200" y2="250" stroke="#00BCD4" strokeWidth="1" opacity="0.1">
        <animate attributeName="opacity" values="0.04;0.16;0.04" dur="5.5s" repeatCount="indefinite" />
      </line>
      <line x1="400" y1="100" x2="400" y2="500" stroke="#D4A017" strokeWidth="0.8" opacity="0.06" />
      <line x1="600" y1="0" x2="600" y2="350" stroke="#00BCD4" strokeWidth="1" opacity="0.08">
        <animate attributeName="opacity" values="0.04;0.14;0.04" dur="6.5s" repeatCount="indefinite" />
      </line>
      <line x1="800" y1="200" x2="800" y2="600" stroke="#D4A017" strokeWidth="0.8" opacity="0.07" />
      <line x1="1000" y1="0" x2="1000" y2="400" stroke="#00BCD4" strokeWidth="1" opacity="0.06" />
      <line x1="1100" y1="300" x2="1100" y2="800" stroke="#D4A017" strokeWidth="0.8" opacity="0.05" />
      <line x1="300" y1="80" x2="350" y2="130" stroke="#00BCD4" strokeWidth="1" opacity="0.12" />
      <line x1="500" y1="200" x2="550" y2="250" stroke="#D4A017" strokeWidth="1" opacity="0.08" />
      <line x1="400" y1="350" x2="450" y2="300" stroke="#00BCD4" strokeWidth="1" opacity="0.1" />
      <circle cx="300" cy="80" r="4" fill="#00BCD4" opacity="0.3">
        <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="200" cy="200" r="3" fill="#D4A017" opacity="0.25">
        <animate attributeName="opacity" values="0.1;0.35;0.1" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="600" cy="350" r="4" fill="#00BCD4" opacity="0.2">
        <animate attributeName="opacity" values="0.08;0.3;0.08" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;5;3" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="800" cy="200" r="3" fill="#00BCD4" opacity="0.15">
        <animate attributeName="opacity" values="0.05;0.25;0.05" dur="4.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="1000" cy="400" r="3" fill="#D4A017" opacity="0.15">
        <animate attributeName="opacity" values="0.05;0.25;0.05" dur="6s" repeatCount="indefinite" />
      </circle>
      <rect x="180" y="65" width="40" height="28" rx="3" stroke="#00BCD4" strokeWidth="0.8" fill="none" opacity="0.08">
        <animate attributeName="opacity" values="0.04;0.12;0.04" dur="5s" repeatCount="indefinite" />
      </rect>
      <rect x="580" y="335" width="40" height="28" rx="3" stroke="#D4A017" strokeWidth="0.8" fill="none" opacity="0.06" />
      <circle r="2" fill="#00BCD4" opacity="0.5">
        <animateMotion dur="3s" repeatCount="indefinite" path="M0,80 L300,80" />
      </circle>
      <circle r="2" fill="#D4A017" opacity="0.4">
        <animateMotion dur="4s" repeatCount="indefinite" path="M0,350 L400,350" />
      </circle>
      <circle r="1.5" fill="#00BCD4" opacity="0.4">
        <animateMotion dur="5s" repeatCount="indefinite" path="M200,0 L200,250" />
      </circle>
    </svg>
  );
}

/* ───────────────────────────────────────
   Section list (BSCPE curriculum)
   ─────────────────────────────────────── */
const SECTIONS = [
  "11001","11002","11003","11004","11005","11006","11007","11008",
  "12001","12002","12003","12004","12005","12006","12007","12008",
  "21001","21002","21003","21004","21005","21006",
  "22001","22002","22003","22004","22005","22006",
  "31001","31002","31003","31004","31005",
  "32001","32002","32003","32004","32005",
  "41001","41002","41003","41004",
  "42001","42002","42003","42004",
];

/* ───────────────────────────────────────
   Capability data
   ─────────────────────────────────────── */
const capabilities = [
  {
    icon: Microchip,
    title: "Embedded Systems Design",
    desc: "Design and program microcontrollers and IoT devices that bridge the physical and digital worlds.",
  },
  {
    icon: CircuitBoard,
    title: "Circuit Analysis & PCB Design",
    desc: "Analyze complex circuits and design printed circuit boards for real-world electronic applications.",
  },
  {
    icon: Code,
    title: "Software & Firmware Development",
    desc: "Build low-level firmware, hardware drivers, and full-stack applications with performance in mind.",
  },
  {
    icon: Wifi,
    title: "Network & Communications",
    desc: "Engineer digital communication systems, from RF design to network protocol implementation.",
  },
  {
    icon: Server,
    title: "Computer Architecture",
    desc: "Understand processor design, memory hierarchy, and system-level optimizations for modern computing.",
  },
  {
    icon: Shield,
    title: "Cybersecurity & Hardware Security",
    desc: "Protect systems from vulnerabilities at both the hardware and software layers of the stack.",
  },
];

/* ───────────────────────────────────────────
   Org Chart helpers
   ─────────────────────────────────────────── */
type OrgAccent = "gold" | "cyan" | "teal" | "slate" | "dim";

const accentStyles: Record<OrgAccent, { ring: string; bg: string; text: string; badge: string }> = {
  gold:  { ring: "border-gold/40",        bg: "bg-gold/10",        text: "text-gold",       badge: "bg-gold/15 text-gold" },
  cyan:  { ring: "border-cyan/40",        bg: "bg-cyan/10",        text: "text-cyan",       badge: "bg-cyan/15 text-cyan" },
  teal:  { ring: "border-teal-400/30",    bg: "bg-teal-400/10",    text: "text-teal-400",   badge: "bg-teal-400/15 text-teal-400" },
  slate: { ring: "border-slate-500/30",   bg: "bg-slate-500/10",   text: "text-slate-300",  badge: "bg-slate-500/15 text-slate-400" },
  dim:   { ring: "border-white/10",       bg: "bg-white/[0.04]",   text: "text-slate-400",  badge: "bg-white/[0.06] text-slate-500" },
};

function OrgCard({ initials, name, position, accent = "slate" }: {
  initials: string;
  name: string;
  position: string;
  accent?: OrgAccent;
}) {
  const s = accentStyles[accent];
  return (
    <div className={`group flex flex-col items-center gap-2.5 rounded-2xl border ${s.ring} bg-white/[0.02] px-3 py-4 sm:px-6 sm:py-5 text-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.04] hover:bg-white/[0.05] hover:shadow-xl w-24 sm:w-44 md:w-48`}>
      {/* Avatar placeholder */}
      <div className={`flex h-10 w-10 sm:h-[72px] sm:w-[72px] items-center justify-center rounded-full border-2 ${s.ring} ${s.bg} text-[11px] sm:text-lg font-bold font-heading ${s.text} shadow-inner transition-transform duration-300 group-hover:scale-105`}>
        {initials}
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] sm:text-sm font-semibold text-white leading-snug">{name}</p>
        <span className={`inline-block rounded-full px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-medium leading-none ${s.badge}`}>
          {position}
        </span>
      </div>
    </div>
  );
}

function OrgRow({ children, wrap = false }: { children: React.ReactNode; wrap?: boolean }) {
  return (
    <div className={`flex ${wrap ? "flex-wrap" : ""} items-start justify-center gap-3 sm:gap-10 sm:gap-16`}>
      {children}
    </div>
  );
}

function OrgConnector() {
  return (
    <div className="flex flex-col items-center py-2">
      <div className="h-5 w-px bg-gradient-to-b from-white/25 to-transparent" />
      <div className="h-2 w-2 rounded-full border border-cyan/30 bg-cyan/20 shadow-[0_0_6px_rgba(0,188,212,0.3)]" />
      <div className="h-5 w-px bg-gradient-to-b from-transparent to-white/25" />
    </div>
  );
}

/* ───────────────────────────────────────────
   Landing Page Component
   ─────────────────────────────────────────── */
export default function Landing() {
  const { user, login, register, verifyOtp, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "verify-otp">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  // OTP step
  const [pendingId, setPendingId] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["" ,"", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const authRef = useRef<HTMLDivElement>(null);

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register form
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [section, setSection] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  function scrollToAuth() {
    authRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (regPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!agreedToTerms) {
        setError("You must agree to the Terms & Agreement to register");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        const id = await register({
          firstName,
          middleName,
          lastName,
          email: regEmail,
          password: regPassword,
          studentNumber,
          section,
        });
        setPendingId(id);
        setPendingEmail(regEmail);
        setOtpDigits(["", "", "", "", "", ""]);
        setResendCooldown(60);
        setMode("verify-otp");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || "Something went wrong");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOtpInput(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < 6; i++) next[i] = text[i] ?? "";
    setOtpDigits(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) { setError("Please enter the complete 6-digit code"); return; }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(pendingId, code);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "pendingApproval" in err) {
        // Registration succeeded but needs officer approval
        const paErr = err as { message?: string };
        setMode("login");
        setError("");
        setPendingApprovalMsg(paErr.message || "Your account is pending approval by an officer.");
        return;
      }
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || "Verification failed");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await api.post("/auth/resend-otp", { pendingId });
      setResendCooldown(60);
    } catch {
      setError("Failed to resend OTP. Please try again.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30";

  return (
    <div className="relative min-h-screen bg-navy text-white">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          NAVBAR
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-navy/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Brand */}
          <a href="#hero" className="flex items-center gap-3">
            <img src={acesLogo} alt="ACES" className="h-9 w-9 object-contain" />
            <span className="hidden font-heading text-lg font-bold tracking-wide text-gold sm:inline">
              A.C.E.S.
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#hero" className="text-sm text-slate-300 transition hover:text-gold">
              Home
            </a>
            <a href="#capabilities" className="text-sm text-slate-300 transition hover:text-gold">
              Capabilities
            </a>
            <a href="#mission" className="text-sm text-slate-300 transition hover:text-gold">
              Mission &amp; Vision
            </a>
            <a href="#org-chart" className="text-sm text-slate-300 transition hover:text-gold">
              Org Chart
            </a>
            <button
              onClick={scrollToAuth}
              className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-navy transition hover:bg-gold-light"
            >
              Sign In
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="text-slate-300 md:hidden"
            onClick={() => setMobileNav(!mobileNav)}
          >
            {mobileNav ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileNav && (
          <div className="border-t border-white/5 bg-navy/95 px-6 py-4 backdrop-blur-lg md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#hero" onClick={() => setMobileNav(false)} className="text-sm text-slate-300 hover:text-gold">Home</a>
              <a href="#capabilities" onClick={() => setMobileNav(false)} className="text-sm text-slate-300 hover:text-gold">Capabilities</a>
              <a href="#mission" onClick={() => setMobileNav(false)} className="text-sm text-slate-300 hover:text-gold">Mission &amp; Vision</a>
              <a href="#org-chart" onClick={() => setMobileNav(false)} className="text-sm text-slate-300 hover:text-gold">Org Chart</a>
              <button
                onClick={() => { setMobileNav(false); scrollToAuth(); }}
                className="mt-1 rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-navy"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — HERO
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="hero"
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-16"
      >
        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,188,212,0.12)_0%,transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,160,23,0.10)_0%,transparent_50%)]" />

        {/* Circuit background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <CircuitBG />
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-6 pt-8 lg:pt-0 lg:grid-cols-2 lg:gap-16">
          {/* Left — Branding */}
          <div className="flex flex-col items-center text-center lg:items-start lg:justify-center lg:text-left">
            <div className="relative mb-6">
              <div className="absolute -inset-6 rounded-full bg-cyan/10 blur-3xl" />
              <img
                src={acesLogo}
                alt="ACES Logo"
                className="relative h-32 w-32 drop-shadow-[0_0_30px_rgba(0,188,212,0.35)] lg:h-40 lg:w-40"
              />
            </div>

            <h1 className="mb-3 font-heading text-4xl font-bold leading-tight tracking-tight lg:text-5xl xl:text-6xl">
              <span className="bg-gradient-to-r from-gold-light via-gold to-gold-dark bg-clip-text text-transparent">
                A.C.E.S.
              </span>
            </h1>
            <p className="mb-2 font-heading text-lg font-medium tracking-wide text-cyan-light lg:text-xl">
              Association of Computer Engineering Students
            </p>
            <p className="mb-6 text-sm leading-relaxed text-slate-400 lg:max-w-md">
              Bestlink College of the Philippines — ICPEP.SE NCR Chapter.
              Empowering future engineers through technology, collaboration, and innovation.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={scrollToAuth}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold via-gold-light to-gold px-6 py-3 text-sm font-semibold text-navy shadow-lg shadow-gold/20 transition hover:shadow-gold/40"
              >
                <LogIn className="h-4 w-4" /> Get Started
              </button>
              <a
                href="#capabilities"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-cyan/30 hover:text-white"
              >
                Learn More <ChevronDown className="h-4 w-4" />
              </a>
            </div>

            {/* Org chart teaser */}
            <a
              href="#org-chart"
              className="mt-5 flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-cyan"
            >
              <Network className="h-3.5 w-3.5" />
              Preview our Chain of Command →
            </a>

            {/* Quick stat pills */}
            <div className="mt-3 flex flex-wrap justify-center gap-3 lg:justify-start">
              {[
                { icon: Cpu, label: "Digital ID System" },
                { icon: CircuitBoard, label: "Task Management" },
                { icon: Zap, label: "Real-time Updates" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-400"
                >
                  <Icon className="h-3.5 w-3.5 text-cyan" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Auth Card */}
          <div ref={authRef} className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-light/60 shadow-2xl backdrop-blur-xl">
                <div className="h-1 w-full bg-gradient-to-r from-cyan via-gold to-cyan" />

                <div className="p-7">
                  {/* Tab toggle — hidden during OTP step */}
                  {mode !== "verify-otp" && (
                    <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(""); }}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm transition-all duration-200 ${
                        mode === "login"
                          ? "bg-gradient-to-r from-gold via-gold-light to-gold font-bold text-navy shadow-lg shadow-gold/25"
                          : "font-medium text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode("register"); setError(""); }}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm transition-all duration-200 ${
                        mode === "register"
                          ? "bg-gradient-to-r from-gold via-gold-light to-gold font-bold text-navy shadow-lg shadow-gold/25"
                          : "font-medium text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <UserPlus className="h-4 w-4" />
                      Register
                    </button>
                  </div>
                  )} {/* end tab toggle */}

                  {error && (
                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  {pendingApprovalMsg && (
                    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                      {pendingApprovalMsg}
                    </div>
                  )}

                  {/* ── OTP VERIFICATION STEP ── */}
                  {mode === "verify-otp" ? (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan/10">
                          <Mail className="h-7 w-7 text-cyan" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-white">Check your email</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          We sent a 6-digit code to{" "}
                          <span className="font-medium text-cyan-light">{pendingEmail}</span>
                        </p>
                      </div>

                      {/* 6-digit OTP boxes */}
                      <div className="flex justify-center gap-2.5">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => { otpRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            aria-label={`OTP digit ${idx + 1}`}
                            placeholder="·"
                            onChange={(e) => handleOtpInput(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onPaste={idx === 0 ? handleOtpPaste : undefined}
                            className="h-14 w-12 rounded-xl border border-white/15 bg-white/5 text-center text-xl font-bold text-white outline-none transition-all focus:border-cyan/60 focus:ring-2 focus:ring-cyan/25 caret-transparent placeholder-white/10"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otpDigits.join("").length !== 6}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold via-gold-light to-gold py-3 text-sm font-semibold text-navy shadow-lg shadow-gold/20 transition-all hover:shadow-gold/40 disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Verify &amp; Create Account</>}
                      </button>

                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resendCooldown > 0}
                          className="flex items-center gap-1.5 text-slate-400 transition hover:text-cyan disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setMode("register"); setError(""); }}
                          className="text-slate-400 transition hover:text-white"
                        >
                          ← Change email
                        </button>
                      </div>
                    </form>
                  ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {mode === "login" ? (
                      /* ── LOGIN FIELDS ── */
                      <>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                            Email
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@gmail.com"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              minLength={6}
                              placeholder="••••••••"
                              className={inputClass + " pr-12"}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" tabIndex={-1}>
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* ── REGISTER FIELDS ── */
                      <>
                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                              First Name <span className="text-red-400">*</span>
                            </label>
                            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                              required placeholder="Juan" className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                              Last Name <span className="text-red-400">*</span>
                            </label>
                            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                              required placeholder="Dela Cruz" className={inputClass} />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                            Middle Name
                            <span className="normal-case text-[10px] font-normal text-slate-600">(optional)</span>
                          </label>
                          <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)}
                            placeholder="Santos" className={inputClass} />
                        </div>

                        {/* Student info row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                              Student No. <span className="text-red-400">*</span>
                            </label>
                            <input type="text" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)}
                              required placeholder="2024-00001" className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                              Section <span className="text-red-400">*</span>
                            </label>
                            <select value={section} onChange={(e) => setSection(e.target.value)}
                              required aria-label="Section" title="Section" className={inputClass}>
                              <option value="" className="bg-navy text-slate-500">Pick section</option>
                              {SECTIONS.map((s) => (
                                <option key={s} value={s} className="bg-navy">
                                  BSCPE - {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                            Email <span className="text-red-400">*</span>
                          </label>
                          <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                            required placeholder="you@gmail.com" className={inputClass} />
                        </div>

                        {/* Password row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                              Password <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                              <input type={showPassword ? "text" : "password"} value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)} required minLength={6}
                                placeholder="••••••••" className={inputClass + " pr-10"} />
                              <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" tabIndex={-1}>
                                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
                              Confirm <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                              <input type={showConfirm ? "text" : "password"} value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                                placeholder="••••••••" className={inputClass + " pr-10"} />
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" tabIndex={-1}>
                                {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Terms & Agreement */}
                        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              Terms &amp; Agreement
                            </p>
                            <a
                              href="#"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-cyan transition-colors hover:text-cyan-light hover:underline"
                            >
                              View Full Terms ↗
                            </a>
                          </div>
                          <div className="max-h-24 overflow-y-auto pr-1 text-xs leading-relaxed text-slate-400">
                            <p>
                              By registering, you agree to abide by the <strong className="text-slate-400">ACES Code of Conduct</strong> and
                              the rules and regulations of the Association of Computer Engineering Students of Bestlink
                              College of the Philippines. You consent to the collection and use of your personal information
                              (name, student number, email, section) for membership management, event attendance, and
                              organizational communications. Your data will not be shared with third parties without your
                              consent. You understand that misuse of the platform or falsification of information may result
                              in suspension or removal of membership. As a member, you are expected to actively participate
                              in organizational activities and uphold the values of integrity, excellence, and camaraderie.
                            </p>
                          </div>
                          <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                            <div
                              onClick={() => setAgreedToTerms(!agreedToTerms)}
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                                agreedToTerms
                                  ? "border-gold bg-gold"
                                  : "border-white/20 bg-white/5"
                              }`}
                            >
                              {agreedToTerms && <CheckCircle2 className="h-3 w-3 text-navy" />}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              I have read and agree to the ACES Terms &amp; Agreement
                            </span>
                          </label>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold via-gold-light to-gold py-3 text-sm font-semibold text-navy shadow-lg shadow-gold/20 transition-all hover:shadow-gold/40 disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : mode === "login" ? (
                        <><LogIn className="h-4 w-4" /> Sign In</>
                      ) : (
                        <><UserPlus className="h-4 w-4" /> Create Account</>
                      )}
                    </button>
                  </form>
                  )} {/* end verify-otp ternary */}

                  {mode !== "verify-otp" && (
                  <>
                  <div className="my-5 flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs text-slate-500">
                      {mode === "login" ? "Admin?" : "Already a member?"}
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {mode === "login" ? (
                    <p className="text-center text-xs text-slate-500">
                      Admin: <span className="font-mono text-cyan-light">chairman@aces.bcp.edu.ph</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(""); }}
                      className="w-full text-center text-sm text-cyan hover:text-cyan-light"
                    >
                      Sign in instead
                    </button>
                  )}
                  </>
                  )}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce text-slate-500">
          <ChevronDown className="h-6 w-6" />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — CpE CAPABILITIES
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="capabilities" className="relative overflow-hidden border-t border-white/5 bg-[#0A1120] py-28">
        {/* Faint gradient accents */}
        <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gold/5 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan">
              What We Do
            </p>
            <h2 className="mb-4 font-heading text-3xl font-bold text-white lg:text-4xl">
              Computer Engineering{" "}
              <span className="bg-gradient-to-r from-gold-light to-gold bg-clip-text text-transparent">
                Capabilities
              </span>
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              As Computer Engineering students, we sit at the crossroads of hardware and software — trained
              to design, build, and optimize the systems that power the modern world.
            </p>
          </div>

          {/* Capability cards grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-xl border border-white/5 bg-white/[0.02] p-7 transition-all duration-300 hover:border-cyan/25 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-cyan/[0.03]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/10 text-cyan transition-all duration-300 group-hover:bg-cyan/20 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-heading text-base font-semibold text-white">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — MISSION & VISION
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="mission" className="relative overflow-hidden border-t border-white/5 bg-navy py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
          <CircuitBG />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">
              Our Purpose
            </p>
            <h2 className="font-heading text-3xl font-bold text-white lg:text-4xl">
              Mission &amp;{" "}
              <span className="bg-gradient-to-r from-cyan-light to-cyan bg-clip-text text-transparent">
                Vision
              </span>
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Mission */}
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-8 backdrop-blur-sm">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/10 blur-2xl" />
              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                  <Target className="h-6 w-6 text-gold" />
                </div>
                <h3 className="mb-4 font-heading text-xl font-bold text-gold">
                  Our Mission
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  To cultivate a dynamic community of Computer Engineering students committed to
                  academic excellence, technical innovation, and professional development. We aim to
                  bridge the gap between theoretical knowledge and practical application by providing
                  hands-on opportunities, industry exposure, and collaborative projects that prepare
                  our members for careers in engineering and technology.
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "Foster collaboration between students and industry professionals",
                    "Promote research, innovation, and technical skill development",
                    "Uphold the highest standards of engineering ethics and integrity",
                  ].map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-400">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Vision */}
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-8 backdrop-blur-sm">
              <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-cyan/10 blur-2xl" />
              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/10">
                  <Lightbulb className="h-6 w-6 text-cyan" />
                </div>
                <h3 className="mb-4 font-heading text-xl font-bold text-cyan-light">
                  Our Vision
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  To be the premier student organization at Bestlink College of the Philippines that
                  empowers Computer Engineering students to become globally competitive engineers,
                  innovative thinkers, and responsible leaders who drive technological advancement
                  and contribute meaningfully to society.
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "A recognized hub for engineering innovation in the Philippines",
                    "Graduates who lead and shape the future of technology",
                    "A strong alumni network that gives back to the community",
                  ].map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-400">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — CHAIN OF COMMAND
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="org-chart" className="relative overflow-hidden border-t border-white/5 bg-[#0A1120] py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/5 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan">
              Leadership
            </p>
            <h2 className="mb-4 font-heading text-3xl font-bold text-white lg:text-4xl">
              Chain of{" "}
              <span className="bg-gradient-to-r from-gold-light to-gold bg-clip-text text-transparent">
                Command
              </span>
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Meet the officers who guide and represent the Association of Computer Engineering Students
              at Bestlink College of the Philippines.
            </p>
          </div>

          {/* Tree */}
          <div className="flex flex-col items-center">

            {/* ── Connector util ── */}
            {/* Row 1: Chairman */}
            <OrgRow>
              <OrgCard initials="JD" name="Juan Dela Cruz" position="Chairman" accent="gold" />
            </OrgRow>

            <OrgConnector />

            {/* Row 2: Vice Chairmen */}
            <OrgRow>
              <OrgCard initials="MS" name="Maria Santos" position="Internal Vice-Chairman" accent="cyan" />
              <OrgCard initials="RL" name="Rafael Lim" position="External Vice-Chairman" accent="cyan" />
            </OrgRow>

            <OrgConnector />

            {/* Row 3: Secretary */}
            <OrgRow>
              <OrgCard initials="AL" name="Angela Lopez" position="Secretary" accent="teal" />
            </OrgRow>

            <OrgConnector />

            {/* Row 4: Auditor & Treasurer */}
            <OrgRow>
              <OrgCard initials="BM" name="Bryan Mendoza" position="Auditor" accent="teal" />
              <OrgCard initials="CR" name="Carla Reyes" position="Treasurer" accent="teal" />
            </OrgRow>

            <OrgConnector />

            {/* Row 5: PIO */}
            <OrgRow>
              <OrgCard initials="DT" name="Diego Torres" position="Public Information Officer" accent="teal" />
            </OrgRow>

            <OrgConnector />

            {/* Row 6: Technical Officers & Event Coordinator */}
            <OrgRow>
              <OrgCard initials="EV" name="Elaine Vergara" position="Technical Officer" accent="slate" />
              <OrgCard initials="GR" name="Grace Ramos" position="Event Coordinator" accent="slate" />
              <OrgCard initials="FP" name="Felix Pascual" position="Technical Officer" accent="slate" />
            </OrgRow>

            <OrgConnector />

            {/* Row 7: Social Media & Multimedia */}
            <OrgRow>
              <OrgCard initials="HB" name="Hannah Bautista" position="Social Media Officer" accent="slate" />
              <OrgCard initials="JF" name="Jasmine Flores" position="MultiMedia Officer" accent="slate" />
              <OrgCard initials="IC" name="Ivan Cruz" position="Social Media Officer" accent="slate" />
            </OrgRow>

            <OrgConnector />

            {/* Row 8: Year Representatives */}
            <OrgRow wrap>
              <OrgCard initials="1R" name="1st Year Rep." position="1st Year Representative" accent="dim" />
              <OrgCard initials="2R" name="2nd Year Rep." position="2nd Year Representative" accent="dim" />
              <OrgCard initials="3R" name="3rd Year Rep." position="3rd Year Representative" accent="dim" />
              <OrgCard initials="4R" name="4th Year Rep." position="4th Year Representative" accent="dim" />
            </OrgRow>

          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FOOTER
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="border-t border-white/5 bg-[#060D18] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <img src={acesLogo} alt="ACES" className="h-7 w-7 object-contain" />
            <span className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} ACES — Bestlink College of the Philippines, ICPEP.SE NCR Chapter
            </span>
          </div>
          <div className="flex gap-6">
            <a href="#hero" className="text-xs text-slate-500 transition hover:text-gold">Home</a>
            <a href="#capabilities" className="text-xs text-slate-500 transition hover:text-gold">Capabilities</a>
            <a href="#mission" className="text-xs text-slate-500 transition hover:text-gold">Mission &amp; Vision</a>
            <a href="#org-chart" className="text-xs text-slate-500 transition hover:text-gold">Org Chart</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
