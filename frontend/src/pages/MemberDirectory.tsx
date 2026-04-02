import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, ChevronDown, BellRing, CheckCircle2, UserPlus, X, Shield, Crown, Eye, EyeOff } from "lucide-react";
import { usersApi, rolesApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { User, Role } from "@/types";

function getRole(user: User): Role | null {
  return typeof user.roleId === "object" ? (user.roleId as Role) : null;
}

type FilterMode = "all" | "officers" | "members";

export default function MemberDirectory() {
  const { user: currentUser, notifyProfileUpdate, refreshUser } = useAuth();
  const navigate = useNavigate();
  const currentUserRole = currentUser?.roleId as Role | undefined;
  const canManageMembers = Array.isArray(currentUserRole?.permissions)
    ? currentUserRole.permissions.includes("MANAGE_MEMBERS")
    : false;
  const isChairman = currentUserRole?.name === "Chairman";

  const [notified, setNotified] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Role change modal
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleChangeError, setRoleChangeError] = useState("");
  const [roleChanging, setRoleChanging] = useState(false);
  const [showNotifyConfirm, setShowNotifyConfirm] = useState(false);

  // Pass Chairmanship modal (3 steps)
  const [chairStep, setChairStep] = useState<0 | 1 | 2 | 3>(0); // 0=closed
  const [chairPassword, setChairPassword] = useState("");
  const [chairPasswordError, setChairPasswordError] = useState("");
  const [chairPasswordVisible, setChairPasswordVisible] = useState(false);
  const [, setChairPasswordVerified] = useState(false);
  const [chairSuccessor, setChairSuccessor] = useState<User | null>(null);
  const [chairSuccessorSearch, setChairSuccessorSearch] = useState("");
  const [chairSelfRole, setChairSelfRole] = useState<"Alumni" | "Member">("Alumni");
  const [chairSubmitting, setChairSubmitting] = useState(false);
  const [chairError, setChairError] = useState("");

  useEffect(() => {
    usersApi.getAll().then(setMembers).catch(() => {});
    rolesApi.getAll().then(setRoles).catch(() => {});
    if (canManageMembers) {
      usersApi.getPending().then(setPendingUsers).catch(() => {});
    }
  }, [canManageMembers]);

  async function handleNotify() {
    setShowNotifyConfirm(false);
    setNotifying(true);
    try {
      await notifyProfileUpdate();
      setNotified(true);
      setTimeout(() => setNotified(false), 4000);
    } finally {
      setNotifying(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const approved = await usersApi.approve(id);
      setPendingUsers((prev) => prev.filter((u) => u._id !== id));
      setMembers((prev) => [...prev, approved]);
    } catch {}
  }

  async function handleReject(id: string) {
    try {
      await usersApi.reject(id);
      setPendingUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {}
  }

  function openRoleModal(user: User) {
    const role = getRole(user);
    setRoleModalUser(user);
    setSelectedRoleId(role?._id || "");
    setRoleChangeError("");
  }

  async function handleRoleChange() {
    if (!roleModalUser || !selectedRoleId) return;
    setRoleChanging(true);
    setRoleChangeError("");
    try {
      const updated = await usersApi.changeRole(roleModalUser._id, selectedRoleId);
      setMembers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      setRoleModalUser(null);
    } catch (err: any) {
      setRoleChangeError(err?.response?.data?.error || "Failed to change role");
    } finally {
      setRoleChanging(false);
    }
  }

  // Roles assignable by current user (below their level)
  const assignableRoles = useMemo(() => {
    const myPos = currentUserRole?.position ?? 9999;
    return roles
      .filter((r) => r.position > myPos)
      .sort((a, b) => a.position - b.position);
  }, [roles, currentUserRole]);

  // Eligible successors for chairmanship (all active members except self)
  const eligibleSuccessors = useMemo(() => {
    const q = chairSuccessorSearch.toLowerCase();
    return members.filter(
      (u) =>
        u._id !== currentUser?._id &&
        (u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.studentNumber.toLowerCase().includes(q))
    );
  }, [members, currentUser, chairSuccessorSearch]);

  function openChairModal() {
    setChairStep(1);
    setChairPassword("");
    setChairPasswordError("");
    setChairPasswordVerified(false);
    setChairPasswordVisible(false);
    setChairSuccessor(null);
    setChairSuccessorSearch("");
    setChairSelfRole("Alumni");
    setChairError("");
  }

  async function handleVerifyChairPassword() {
    if (!chairPassword) { setChairPasswordError("Password is required"); return; }
    setChairPasswordError("");
    setChairSubmitting(true);
    try {
      await usersApi.verifyPassword(chairPassword);
      setChairPasswordVerified(true);
      setChairStep(2);
    } catch (err: any) {
      setChairPasswordError(err?.response?.data?.error || "Incorrect password");
    } finally {
      setChairSubmitting(false);
    }
  }

  async function handleChairSubmit() {
    if (!chairSuccessor) return;
    setChairSubmitting(true);
    setChairError("");
    try {
      const result = await usersApi.passChairmanship({
        password: chairPassword,
        newChairmanId: chairSuccessor._id,
        selfRoleName: chairSelfRole,
      });
      // Update auth context with new role
      await refreshUser();
      // Update local member list
      setMembers((prev) =>
        prev.map((u) => {
          if (u._id === chairSuccessor._id) return { ...u, roleId: result.user.roleId }; // will be Chairman
          if (u._id === currentUser?._id) return result.user;
          return u;
        })
      );
      setChairStep(0);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Transfer failed";
      // If password was wrong, go back to step 1
      if (err?.response?.status === 401) {
        setChairPasswordVerified(false);
        setChairStep(1);
        setChairPasswordError(msg);
      } else {
        setChairError(msg);
      }
    } finally {
      setChairSubmitting(false);
    }
  }

  // Filter + search
  const filtered = useMemo(() => {
    let list = members;

    // Role filter
    if (filterMode === "officers") {
      list = list.filter((u) => {
        const r = getRole(u);
        return r && r.name !== "Member";
      });
    } else if (filterMode === "members") {
      list = list.filter((u) => {
        const r = getRole(u);
        return r && r.name === "Member";
      });
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.studentNumber.toLowerCase().includes(q)
      );
    }

    return list;
  }, [members, filterMode, search]);

  const filterLabel = filterMode === "all" ? "All Roles" : filterMode === "officers" ? "Officers" : "Members";

  return (
    <div className="space-y-4">
      {/* ─── Pending Registrations ─── */}
      {canManageMembers && pendingUsers.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus size={18} className="text-amber-500" />
              <h3 className="font-semibold text-amber-500">
                Pending Registrations ({pendingUsers.length})
              </h3>
            </div>
            <div className="space-y-2">
              {pendingUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background/60 rounded-lg px-4 py-3 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs font-bold bg-amber-500/20 text-amber-500">
                        {user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Student No.</span>
                      <span className="text-muted-foreground font-mono">{user.studentNumber}</span>
                    </div>
                    {user.section && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Section</span>
                        <span className="font-medium text-foreground">BSCPE {user.section}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleApprove(user._id)}
                      className="px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 font-medium transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(user._id)}
                      className="px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Search & Filter ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input text-sm text-muted-foreground hover:border-foreground/20 transition-colors"
          >
            {filterLabel} <ChevronDown size={14} />
          </button>
          {filterOpen && (
            <div className="absolute top-full mt-1 right-0 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
              {(["all", "officers", "members"] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setFilterMode(mode);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors ${
                    filterMode === mode ? "text-cyan font-medium" : "text-foreground"
                  }`}
                >
                  {mode === "all" ? "All Roles" : mode === "officers" ? "Officers" : "Members"}
                </button>
              ))}
            </div>
          )}
        </div>
        {canManageMembers && (
          <button
            onClick={() => setShowNotifyConfirm(true)}
            disabled={notifying || notified}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              disabled:opacity-70 disabled:cursor-not-allowed
              bg-gold/10 border border-gold/40 text-gold hover:bg-gold/20 hover:border-gold/60"
          >
            {notified ? (
              <>
                <CheckCircle2 size={15} />
                Notified!
              </>
            ) : (
              <>
                <BellRing size={15} className={notifying ? "animate-pulse" : ""} />
                Request Profile Update
              </>
            )}
          </button>
        )}
        {isChairman && (
          <button
            onClick={openChairModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
          >
            <Crown size={15} />
            Pass Chairmanship
          </button>
        )}
      </div>

      {/* ─── Member Table ─── */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Member</th>
                <th className="text-left py-3 px-4 font-medium">Student No.</th>
                <th className="text-left py-3 px-4 font-medium">Section</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                {canManageMembers && (
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const role = getRole(user);
                return (
                  <tr
                    key={user._id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/members/${user._id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className="text-xs font-bold"
                            style={{
                              backgroundColor: `${role?.color}20`,
                              color: role?.color,
                            }}
                          >
                            {user.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium group-hover:text-cyan transition-colors">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {user.studentNumber}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {user.section ? `BSCPE ${user.section}` : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className="border-0 font-semibold text-xs"
                        style={{
                          backgroundColor: `${role?.color}20`,
                          color: role?.color,
                        }}
                      >
                        {role?.name}
                      </Badge>
                    </td>
                    {canManageMembers && (
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {/* Can't change role of users at/above your level */}
                        {role &&
                          currentUserRole &&
                          role.position > currentUserRole.position && (
                            <button
                              onClick={() => openRoleModal(user)}
                              className="text-xs text-cyan hover:underline opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                            >
                              Change Role
                            </button>
                          )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ─── Notify Confirmation Modal ─── */}
      {showNotifyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <BellRing size={18} className="text-gold" />
              <h3 className="font-semibold">Confirm Notification</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                This will send a profile update request to <span className="font-medium text-foreground">all members</span>. Are you sure?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNotifyConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-input text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNotify}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30 transition-colors"
                >
                  Yes, Notify All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Pass Chairmanship Modal ─── */}
      {chairStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-red-500/5">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-red-400" />
                <h3 className="font-semibold text-red-400">Pass Chairmanship</h3>
                <span className="text-xs text-muted-foreground ml-1">Step {chairStep} of 3</span>
              </div>
              <button
                title="Close"
                onClick={() => setChairStep(0)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Step 1 — Verify Password */}
              {chairStep === 1 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    This action is <span className="font-semibold text-red-400">irreversible</span>. Enter your password to confirm your identity.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                      Your Password
                    </label>
                    <div className="relative">
                      <input
                        type={chairPasswordVisible ? "text" : "password"}
                        value={chairPassword}
                        onChange={(e) => { setChairPassword(e.target.value); setChairPasswordError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleVerifyChairPassword()}
                        placeholder="Enter your password"
                        className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        type="button"
                        title={chairPasswordVisible ? "Hide password" : "Show password"}
                        onClick={() => setChairPasswordVisible((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {chairPasswordVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {chairPasswordError && (
                      <p className="text-xs text-red-500 mt-1">{chairPasswordError}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setChairStep(0)}
                      className="px-4 py-2 rounded-lg text-sm border border-input text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerifyChairPassword}
                      disabled={!chairPassword || chairSubmitting}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {/* Step 2 — Choose Successor */}
              {chairStep === 2 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Choose the member who will receive the <span className="font-semibold text-gold">Chairman</span> position.
                  </p>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={chairSuccessorSearch}
                      onChange={(e) => setChairSuccessorSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {eligibleSuccessors.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No members found</p>
                    )}
                    {eligibleSuccessors.map((u) => {
                      const r = getRole(u);
                      const isSelected = chairSuccessor?._id === u._id;
                      return (
                        <button
                          key={u._id}
                          onClick={() => setChairSuccessor(u)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border ${
                            isSelected
                              ? "border-gold/50 bg-gold/10"
                              : "border-transparent hover:bg-muted/50"
                          }`}
                        >
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback
                              className="text-xs font-bold"
                              style={{ backgroundColor: `${r?.color}20`, color: r?.color }}
                            >
                              {u.fullName.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{r?.name}</p>
                          </div>
                          {isSelected && <CheckCircle2 size={15} className="text-gold ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between gap-2 pt-1">
                    <button
                      onClick={() => setChairStep(1)}
                      className="px-4 py-2 rounded-lg text-sm border border-input text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => { setChairError(""); setChairStep(3); }}
                      disabled={!chairSuccessor}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {/* Step 3 — Choose own role + confirm */}
              {chairStep === 3 && chairSuccessor && (
                <>
                  <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">New Chairman:</span> <span className="font-semibold">{chairSuccessor.fullName}</span></p>
                    <p><span className="text-muted-foreground">Your new role:</span> <span className="font-semibold">{chairSelfRole}</span></p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                      After passing, you become:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Alumni", "Member"] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => setChairSelfRole(role)}
                          className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${
                            chairSelfRole === role
                              ? role === "Alumni"
                                ? "border-stone-500/60 bg-stone-500/15 text-stone-300"
                                : "border-slate-500/60 bg-slate-500/15 text-slate-300"
                              : "border-input text-muted-foreground hover:border-foreground/20"
                          }`}
                        >
                          {role}
                          <span className="block text-xs font-normal opacity-70 mt-0.5">
                            {role === "Alumni" ? "Former officer" : "Regular member"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {chairError && (
                    <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                      {chairError}
                    </p>
                  )}
                  <div className="flex justify-between gap-2 pt-1">
                    <button
                      onClick={() => setChairStep(2)}
                      className="px-4 py-2 rounded-lg text-sm border border-input text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleChairSubmit}
                      disabled={chairSubmitting}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {chairSubmitting ? "Transferring..." : "Transfer Chairmanship"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Role Change Modal ─── */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-cyan" />
                <h3 className="font-semibold">Change Role</h3>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-bold bg-cyan/20 text-cyan">
                    {roleModalUser.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{roleModalUser.fullName}</p>
                  <p className="text-xs text-muted-foreground">{roleModalUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Assign Role
                </label>
                <select
                  value={selectedRoleId}
                  aria-label="Select role"
                  onChange={(e) => {
                    setSelectedRoleId(e.target.value);
                    setRoleChangeError("");
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>
                    Select a role...
                  </option>
                  {assignableRoles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {roleChangeError && (
                <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {roleChangeError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setRoleModalUser(null)}
                  className="px-4 py-2 rounded-lg text-sm border border-input text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={
                    !selectedRoleId ||
                    selectedRoleId === (getRole(roleModalUser)?._id || "") ||
                    roleChanging
                  }
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan text-white hover:bg-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {roleChanging ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
