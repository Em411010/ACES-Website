import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Check, Loader2 } from "lucide-react";
import { rolesApi } from "@/services/api";
import { useEffect, useState, Fragment } from "react";
import type { Role } from "@/types";

// ─── All available permissions ────────────────────────────────────────────────
const PERMISSION_GROUPS = [
  {
    category: "Administration",
    permissions: [
      { key: "MANAGE_ROLES",    label: "Manage Roles",    desc: "Create, edit and reorder roles" },
      { key: "MANAGE_MEMBERS",  label: "Manage Members",  desc: "Approve registrations, change roles" },
      { key: "VIEW_AUDIT_LOGS", label: "View Audit Logs", desc: "Access system audit trail" },
    ],
  },
  {
    category: "Communications",
    permissions: [
      { key: "POST_ANNOUNCEMENT", label: "Post Announcements", desc: "Create and publish announcements" },
      { key: "MANAGE_DOCUMENTS",  label: "Manage Documents",   desc: "Upload and delete documents" },
      { key: "BYPASS_MUST_READ",  label: "Bypass Must-Read",   desc: "Skip must-read acknowledgements" },
    ],
  },
  {
    category: "Operations",
    permissions: [
      { key: "CREATE_TASK",        label: "Create Tasks",        desc: "Create and manage tasks & events" },
      { key: "APPROVE_SUBMISSIONS",label: "Approve Submissions", desc: "Review and approve task submissions" },
      { key: "SCAN_ATTENDANCE",    label: "Scan Attendance",     desc: "Mark attendance via QR or self-mark" },
      { key: "MANAGE_ACTIVITIES",  label: "Manage Activities",   desc: "Create, edit and delete activities" },
    ],
  },
];

// Roles whose permissions cannot be toggled
const LOCKED_ROLES = ["Chairman", "Member", "Alumni"];

export default function RoleManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  // saving[roleId][permKey] = true while request in flight
  const [saving, setSaving] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    rolesApi.getAll().then(setRoles).catch(() => {});
  }, []);

  const sortedRoles = [...roles].sort((a, b) => a.position - b.position);

  async function togglePermission(role: Role, permKey: string) {
    if (LOCKED_ROLES.includes(role.name)) return;

    const hadPerm = role.permissions.includes(permKey);
    const newPerms = hadPerm
      ? role.permissions.filter((p) => p !== permKey)
      : [...role.permissions, permKey];

    // Optimistic update
    setRoles((prev) =>
      prev.map((r) => (r._id === role._id ? { ...r, permissions: newPerms } : r))
    );
    setSaving((prev) => ({
      ...prev,
      [role._id]: { ...(prev[role._id] ?? {}), [permKey]: true },
    }));

    try {
      const updated: Role = await rolesApi.updatePermissions(role._id, newPerms);
      setRoles((prev) => prev.map((r) => (r._id === role._id ? updated : r)));
    } catch {
      // Revert on error
      setRoles((prev) => prev.map((r) => (r._id === role._id ? role : r)));
    } finally {
      setSaving((prev) => ({
        ...prev,
        [role._id]: { ...(prev[role._id] ?? {}), [permKey]: false },
      }));
    }
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 rounded bg-primary/20 border border-primary/40 items-center justify-center">
            <Check className="h-2.5 w-2.5 text-primary" />
          </span>
          Permitted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 rounded border border-border bg-transparent" />
          Not permitted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 rounded bg-muted items-center justify-center">
            <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
          </span>
          Locked (fixed)
        </span>
        <span className="hidden sm:inline ml-auto text-muted-foreground/60 italic">
          Click any cell to toggle — changes save instantly
        </span>
      </div>

      {/* Matrix card */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            {/* Role header row */}
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="sticky left-0 z-20 bg-card text-left px-2 md:px-5 py-4 w-[100px] min-w-[100px] md:w-auto md:min-w-[220px] font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Permission
                </th>
                {sortedRoles.map((role) => {
                  const locked = LOCKED_ROLES.includes(role.name);
                  const totalPerms = role.name === "Chairman"
                    ? PERMISSION_GROUPS.reduce((s, g) => s + g.permissions.length, 0)
                    : role.permissions.length;
                  return (
                    <th
                      key={role._id}
                      className="px-2 md:px-3 py-3 text-center min-w-[64px] md:min-w-[100px] max-w-[120px]"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <span
                          className="font-semibold leading-tight text-[11px]"
                          style={{ color: role.color }}
                        >
                          {role.name}
                        </span>
                        {locked ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-3.5 leading-none"
                          >
                            {role.name === "Chairman" ? "Full Access" : "No Access"}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {totalPerms} perm{totalPerms !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {PERMISSION_GROUPS.map(({ category, permissions }) => (
                <Fragment key={category}>
                  {/* Category header row */}
                  <tr key={`cat-${category}`} className="bg-muted/20 border-t border-b border-border/60">
                    <td
                      className="sticky left-0 z-10 bg-card px-2 md:px-5 py-2 font-bold text-[10px] uppercase tracking-widest text-muted-foreground"
                    >
                      {category}
                    </td>
                    {sortedRoles.map((r) => (
                      <td key={r._id} />
                    ))}
                  </tr>

                  {permissions.map((perm, pi) => (
                    <tr
                      key={perm.key}
                      className={`border-b border-border/40 hover:bg-muted/10 transition-colors ${
                        pi === permissions.length - 1 ? "border-b-border/60" : ""
                      }`}
                    >
                      {/* Permission label */}
                      <td className="sticky left-0 z-10 bg-card px-2 md:px-5 py-3 w-[100px] min-w-[100px] md:w-auto md:min-w-[220px]">
                        <p className="font-semibold text-foreground">{perm.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{perm.desc}</p>
                      </td>

                      {/* Toggle cells */}
                      {sortedRoles.map((role) => {
                        const locked = LOCKED_ROLES.includes(role.name);
                        const isChairman = role.name === "Chairman";
                        const hasPerm =
                          isChairman || role.permissions.includes(perm.key);
                        const isSaving = saving[role._id]?.[perm.key];

                        return (
                          <td key={role._id} className="text-center px-2 md:px-3 py-3">
                            {locked ? (
                              /* Locked indicator */
                              <div className="flex justify-center">
                                {isChairman ? (
                                  <div className="w-5 h-5 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-primary" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded bg-muted border border-border flex items-center justify-center">
                                    <Lock className="w-3 h-3 text-muted-foreground/40" />
                                  </div>
                                )}
                              </div>
                            ) : isSaving ? (
                              /* Saving spinner */
                              <div className="flex justify-center">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              /* Interactive toggle */
                              <button
                                onClick={() => togglePermission(role, perm.key)}
                                title={`${hasPerm ? "Revoke" : "Grant"} ${perm.label} for ${role.name}`}
                                className={`w-5 h-5 rounded border transition-all duration-150 flex items-center justify-center mx-auto
                                  ${hasPerm
                                    ? "bg-primary/15 border-primary/50 hover:bg-primary/25 hover:border-primary/70"
                                    : "bg-transparent border-border hover:border-primary/40 hover:bg-primary/5"
                                  }`}
                              >
                                {hasPerm && <Check className="w-3 h-3 text-primary" />}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
