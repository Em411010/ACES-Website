import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";
import { CircuitPattern } from "@/components/ui/circuit-pattern";
import acesLogo from "@/assets/aces_logo.png";
import type { Role } from "@/types";

export default function DigitalID() {
  const { user } = useAuth();
  const role = user?.roleId && typeof user.roleId === "object" ? (user.roleId as Role) : null;
  const initials = (user?.fullName ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("");

  const qrValue = user?.digitalIDHash
    ? `ACES:${user.digitalIDHash}`
    : "ACES:unknown";

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground text-center">
        Your digital membership ID. Show the QR code for event attendance scanning.
      </p>

      {/* ── ID Card ── */}
      <div
        className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: "linear-gradient(160deg, #0F1B2D 0%, #1E3A5F 100%)" }}
      >
        {/* Circuit background */}
        <CircuitPattern className="absolute inset-0 w-full h-full text-cyan opacity-10 pointer-events-none" />

        {/* ── Header: Logo + Org Name ── */}
        <div className="relative z-10 flex flex-col items-center gap-2 pt-7 pb-5 px-6 border-b border-white/10">
          <img src={acesLogo} alt="ACES Logo" className="h-14 w-14 object-contain drop-shadow-md" />
          <div className="text-center">
            <p className="text-gold font-heading font-bold text-xl tracking-widest leading-none">
              A.C.E.S.
            </p>
            <p className="text-white/50 text-[9px] tracking-wider uppercase mt-0.5">
              Association of Computer Engineering Students
            </p>
          </div>
        </div>

        {/* ── Profile Section ── */}
        <div className="relative z-10 flex flex-col items-center gap-3 px-6 pt-5 pb-4">
          {/* Avatar */}
          <div
            className="h-24 w-24 rounded-full border-2 border-gold/50 bg-navy flex items-center justify-center shadow-lg overflow-hidden"
            style={{ boxShadow: "0 0 18px rgba(212,160,23,0.25)" }}
          >
            <span className="text-3xl font-bold font-heading text-gold">{initials}</span>
          </div>

          {/* Name + role badge */}
          <div className="text-center">
            <h2 className="text-white font-heading font-bold text-lg leading-tight">
              {user?.fullName}
            </h2>
            {role && (
              <span
                className="inline-block mt-1 text-[11px] font-semibold px-3 py-0.5 rounded-full"
                style={{ backgroundColor: `${role.color}25`, color: role.color, border: `1px solid ${role.color}50` }}
              >
                {role.name}
              </span>
            )}
          </div>
        </div>

        {/* ── Details ── */}
        <div className="relative z-10 mx-5 mb-4 rounded-xl bg-white/5 border border-white/10 divide-y divide-white/10">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-white/40 text-xs w-16 shrink-0">Section</span>
            <span className="text-white text-xs font-medium">
              {user?.section ? `BSCPE ${user.section}` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-white/40 text-xs w-16 shrink-0">Email</span>
            <span className="text-white text-xs font-medium truncate">{user?.email}</span>
          </div>
        </div>

        {/* ── QR Code ── */}
        <div className="relative z-10 flex flex-col items-center gap-2 pb-6 px-6">
          <div className="bg-white rounded-xl p-3 shadow-md">
            <QRCodeSVG
              value={qrValue}
              size={148}
              bgColor="#ffffff"
              fgColor="#0F1B2D"
              level="M"
            />
          </div>
          <p className="text-white/30 text-[9px] font-mono tracking-wider">
            {user?.digitalIDHash?.slice(0, 24)}…
          </p>
        </div>

        {/* Bottom gold-cyan bar */}
        <div className="h-1.5 bg-gradient-to-r from-gold via-cyan to-gold" />
      </div>
    </div>
  );
}
