import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { rolesApi, usersApi } from "@/services/api";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Role, User } from "@/types";

/* ── helpers ──────────────────────────────────────────── */
function getOfficers(users: User[], roleId: string): User[] {
  return users.filter((u) => {
    const r = typeof u.roleId === "object" ? (u.roleId as Role) : null;
    return r?._id === roleId;
  });
}

/* ── uniform person card ──────────────────────────────── */
function PersonCard({ officer, role, accent, onClick }: { officer: User; role: Role; accent?: boolean; onClick?: () => void }) {
  const initials = officer.fullName.split(" ").map((n) => n[0]).join("");
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center gap-2.5 bg-card border rounded-xl px-3 sm:px-4 py-4 text-center w-32 sm:w-40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${
        accent ? "shadow-md" : "shadow-sm"
      }`}
      style={{ borderColor: `${role.color}${accent ? "60" : "30"}` }}
    >
      <div className="relative">
        <Avatar className="h-11 w-11">
          <AvatarFallback
            className="text-sm font-bold"
            style={{ backgroundColor: `${role.color}20`, color: role.color }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {accent && (
          <span className="absolute -top-1 -right-1 text-[10px]"></span>
        )}
      </div>
      <div className="min-w-0 w-full">
        <p className="text-xs font-semibold leading-tight truncate">{officer.fullName}</p>
        <p
          className="text-[10px] font-medium mt-0.5"
          style={{ color: role.color }}
        >
          {role.name}
        </p>
      </div>
    </div>
  );
}

/* ── officer detail modal ─────────────────────────────── */
function OfficerDetailModal({ officer, role, onClose }: { officer: User; role: Role; onClose: () => void }) {
  const initials = officer.fullName.split(" ").map((n) => n[0]).join("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Header accent band */}
        <div className="h-36" style={{ background: `linear-gradient(135deg, ${role.color}30, ${role.color}10)` }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Avatar overlapping the header */}
        <div className="flex justify-center -mt-[4.5rem]">
          <Avatar className="h-36 w-36 border-4 border-card shadow-md">
            <AvatarFallback
              className="text-4xl font-bold"
              style={{ backgroundColor: `${role.color}20`, color: role.color }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Body */}
        <div className="px-8 pt-5 pb-8 text-center">
          <h3 className="text-xl font-bold">{officer.fullName}</h3>
          <Badge className="mt-2 text-sm px-3 py-0.5" style={{ backgroundColor: `${role.color}20`, color: role.color, border: `1px solid ${role.color}40` }}>
            {role.name}
          </Badge>

          <div className="mt-6 space-y-4 text-left">
            <div className="flex items-start gap-4">
              <span className="text-muted-foreground text-sm w-24 shrink-0 pt-0.5">Section</span>
              <span className="text-sm font-medium">{officer.section ? `BSCPE ${officer.section}` : "—"}</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-muted-foreground text-sm w-24 shrink-0 pt-0.5">Email</span>
              <span className="text-sm font-medium break-all">{officer.email}</span>
            </div>
            {role.officialDuties && (
              <div className="flex items-start gap-4">
                <span className="text-muted-foreground text-sm w-24 shrink-0 pt-0.5">Duties</span>
                <span className="text-sm leading-relaxed">{role.officialDuties}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── vacant detail modal ──────────────────────────────── */
function VacantDetailModal({ role, onClose }: { role: Role; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Header accent band */}
        <div className="h-36" style={{ background: `linear-gradient(135deg, ${role.color}15, ${role.color}05)` }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Avatar overlapping the header */}
        <div className="flex justify-center -mt-[4.5rem]">
          <Avatar className="h-36 w-36 border-4 border-card shadow-md">
            <AvatarFallback className="text-4xl font-bold text-muted-foreground bg-muted/60">?</AvatarFallback>
          </Avatar>
        </div>

        {/* Body */}
        <div className="px-8 pt-5 pb-8 text-center">
          <h3 className="text-xl font-bold text-muted-foreground">Vacant</h3>
          <Badge className="mt-2 text-sm px-3 py-0.5" style={{ backgroundColor: `${role.color}20`, color: role.color, border: `1px solid ${role.color}40` }}>
            {role.name}
          </Badge>

          <div className="mt-6 space-y-4 text-left">
            <div className="flex items-start gap-4">
              <span className="text-muted-foreground text-sm w-24 shrink-0 pt-0.5">Section</span>
              <span className="text-sm text-muted-foreground">N/A</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-muted-foreground text-sm w-24 shrink-0 pt-0.5">Email</span>
              <span className="text-sm text-muted-foreground">N/A</span>
            </div>
            {role.officialDuties && (
              <div className="flex items-start gap-4">
                <span className="text-muted-foreground text-sm w-24 shrink-0 pt-0.5">Duties</span>
                <span className="text-sm leading-relaxed">{role.officialDuties}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VacantCard({ role, onClick }: { role: Role; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 bg-card border border-dashed rounded-xl px-3 sm:px-4 py-4 text-center w-32 sm:w-40 opacity-40 cursor-pointer hover:opacity-60 transition-opacity"
      style={{ borderColor: `${role.color}40` }}
    >
      <Avatar className="h-11 w-11">
        <AvatarFallback className="text-sm text-muted-foreground bg-muted/60">?</AvatarFallback>
      </Avatar>
      <div className="min-w-0 w-full">
        <p className="text-xs font-medium text-muted-foreground">Vacant</p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{role.name}</p>
      </div>
    </div>
  );
}

/* ── connector between tiers ─────────────────────────── */
function Connector() {
  return (
    <div className="flex justify-center">
      <div className="w-px h-6 bg-border" />
    </div>
  );
}

/* ── tier row wrapper ────────────────────────────────── */
function Tier({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {label && (
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
          {label}
        </span>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {children}
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────── */
export default function ChainOfCommand() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<{ officer: User; role: Role } | null>(null);
  const [selectedVacant, setSelectedVacant] = useState<Role | null>(null);

  useEffect(() => {
    rolesApi.getAll().then(setRoles).catch(() => {});
    usersApi.getAll().then(setUsers).catch(() => {});
  }, []);

  // helpers
  function findRole(name: string): Role | undefined {
    return roles.find((r) => r.name === name);
  }
  function renderCards(role: Role | undefined, accent?: boolean) {
    if (!role) return null;
    const officers = getOfficers(users, role._id);
    if (officers.length === 0) return <VacantCard role={role} onClick={() => setSelectedVacant(role)} />;
    return officers.map((o) => (
      <PersonCard key={o._id} officer={o} role={role} accent={accent} onClick={() => setSelectedOfficer({ officer: o, role })} />
    ));
  }

  // Roles
  const chairman = findRole("Chairman");
  const ivc = findRole("Internal Vice-Chairman");
  const evc = findRole("External Vice-Chairman");
  const secretary = findRole("Secretary");
  const auditor = findRole("Auditor");
  const treasurer = findRole("Treasurer");
  const pio = findRole("Public Information Officer");
  const eventCoord = findRole("Event Coordinator");
  const techOfficer = findRole("Technical Officer");
  const smo = findRole("Social Media Officer");
  const multimedia = findRole("Multimedia Officer");
  const yearReps = [
    findRole("1st Year Representative"),
    findRole("2nd Year Representative"),
    findRole("3rd Year Representative"),
    findRole("4th Year Representative"),
  ].filter(Boolean) as Role[];
  const memberRole = findRole("Member");

  const memberOfficers = memberRole ? getOfficers(users, memberRole._id) : [];

  return (
    <div className="max-w-5xl mx-auto overflow-x-auto">
      <p className="text-sm text-muted-foreground text-center mb-6 md:mb-10">
        Organizational hierarchy of ACES
      </p>

      <div className="flex flex-col items-center min-w-[400px]">
        {/* ── Chairman ── */}
        <Tier>{renderCards(chairman, true)}</Tier>

        <Connector />

        {/* ── Vice-Chairmans ── */}
        <Tier>
          {renderCards(ivc)}
          {renderCards(evc)}
        </Tier>

        <Connector />

        {/* ── Secretary ── */}
        <Tier>{renderCards(secretary)}</Tier>

        <Connector />

        {/* ── Auditor + Treasurer ── */}
        <Tier>
          {renderCards(auditor)}
          {renderCards(treasurer)}
        </Tier>

        <Connector />

        {/* ── PIO ── */}
        <Tier>{renderCards(pio)}</Tier>

        <Connector />

        {/* ── Event Coordinator (center) + Technical Officers (flanking) ── */}
        <Tier label="Operations">
          {(() => {
            const techOfficers = techOfficer ? getOfficers(users, techOfficer._id) : [];
            const ecOfficers = eventCoord ? getOfficers(users, eventCoord._id) : [];
            const left = techOfficers.slice(0, Math.ceil(techOfficers.length / 2));
            const right = techOfficers.slice(Math.ceil(techOfficers.length / 2));
            return (
              <>
                {left.map((o) => <PersonCard key={o._id} officer={o} role={techOfficer!} onClick={() => setSelectedOfficer({ officer: o, role: techOfficer! })} />)}
                {ecOfficers.length > 0
                  ? ecOfficers.map((o) => <PersonCard key={o._id} officer={o} role={eventCoord!} onClick={() => setSelectedOfficer({ officer: o, role: eventCoord! })} />)
                  : eventCoord && <VacantCard role={eventCoord} onClick={() => setSelectedVacant(eventCoord!)} />}
                {right.map((o) => <PersonCard key={o._id} officer={o} role={techOfficer!} onClick={() => setSelectedOfficer({ officer: o, role: techOfficer! })} />)}
                {techOfficers.length === 0 && techOfficer && <VacantCard role={techOfficer} onClick={() => setSelectedVacant(techOfficer!)} />}
              </>
            );
          })()}
        </Tier>

        <Connector />

        {/* ── Multimedia Officer (center) + Social Media Officers (flanking) ── */}
        <Tier label="Communications">
          {(() => {
            const smoOfficers = smo ? getOfficers(users, smo._id) : [];
            const mmOfficers = multimedia ? getOfficers(users, multimedia._id) : [];
            const left = smoOfficers.slice(0, Math.ceil(smoOfficers.length / 2));
            const right = smoOfficers.slice(Math.ceil(smoOfficers.length / 2));
            return (
              <>
                {left.map((o) => <PersonCard key={o._id} officer={o} role={smo!} onClick={() => setSelectedOfficer({ officer: o, role: smo! })} />)}
                {mmOfficers.length > 0
                  ? mmOfficers.map((o) => <PersonCard key={o._id} officer={o} role={multimedia!} onClick={() => setSelectedOfficer({ officer: o, role: multimedia! })} />)
                  : multimedia && <VacantCard role={multimedia} onClick={() => setSelectedVacant(multimedia!)} />}
                {right.map((o) => <PersonCard key={o._id} officer={o} role={smo!} onClick={() => setSelectedOfficer({ officer: o, role: smo! })} />)}
                {smoOfficers.length === 0 && smo && <VacantCard role={smo} onClick={() => setSelectedVacant(smo!)} />}
              </>
            );
          })()}
        </Tier>

        <Connector />

        {/* ── Year Representatives ── */}
        <Tier label="Year Representatives">
          {yearReps.map((r) => (
            <span key={r._id}>{renderCards(r)}</span>
          ))}
        </Tier>

        <Connector />

        {/* ── Members (grouped) ── */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
            Members
          </span>
          <div
            className="bg-card border rounded-xl px-6 py-3.5 flex items-center gap-4 shadow-sm"
            style={{ borderColor: `${memberRole?.color ?? "#475569"}30` }}
          >
            <div className="flex -space-x-2">
              {memberOfficers.slice(0, 6).map((o) => (
                <Avatar key={o._id} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback
                    className="text-[10px] font-bold"
                    style={{
                      backgroundColor: `${memberRole?.color ?? "#475569"}20`,
                      color: memberRole?.color ?? "#475569",
                    }}
                  >
                    {o.fullName.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
              {memberOfficers.length > 6 && (
                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                  +{memberOfficers.length - 6}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: memberRole?.color }}>
                {memberOfficers.length}
              </p>
              <p className="text-[11px] text-muted-foreground">
                active member{memberOfficers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Officer detail modal */}
      {selectedOfficer && (
        <OfficerDetailModal
          officer={selectedOfficer.officer}
          role={selectedOfficer.role}
          onClose={() => setSelectedOfficer(null)}
        />
      )}

      {/* Vacant detail modal */}
      {selectedVacant && (
        <VacantDetailModal
          role={selectedVacant}
          onClose={() => setSelectedVacant(null)}
        />
      )}
    </div>
  );
}
