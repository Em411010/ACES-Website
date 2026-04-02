import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Mail,
  Hash,
  BookOpen,
  CalendarCheck,
  CalendarX,
  BarChart3,
  Pencil,
  X,
  Camera,
  Check,
} from "lucide-react";
import { usersApi, activitiesApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import type { User, Role } from "@/types";

interface AttendanceRecord {
  activityId: string;
  activityName: string;
  venue: string;
  dateTime: string;
  markedAt?: string;
  method?: string;
}

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const isSelf = currentUser?._id === id;

  const [member, setMember] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [allActivitiesCount, setAllActivitiesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", middleName: "", lastName: "", studentNumber: "", section: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      usersApi.getById(id),
      activitiesApi.userAttendance(id),
      activitiesApi.getAll(),
    ])
      .then(([user, att, allActs]) => {
        setMember(user);
        setAttendance(att);
        setAllActivitiesCount(allActs.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  function openEditModal() {
    if (!member) return;
    setEditForm({
      firstName: member.firstName ?? "",
      middleName: member.middleName ?? "",
      lastName: member.lastName ?? "",
      studentNumber: member.studentNumber ?? "",
      section: member.section ?? "",
    });
    setEditError("");
    setShowEdit(true);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setEditSaving(true);
    setEditError("");
    try {
      const updated = await usersApi.update(id, editForm);
      setMember(updated);
      if (isSelf) await refreshUser();
      setShowEdit(false);
    } catch (err: unknown) {
      setEditError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to save changes");
    } finally {
      setEditSaving(false);
    }
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    usersApi
      .uploadAvatar(id, fd)
      .then((updated: User) => {
        setMember(updated);
        setAvatarPreview(null);
        if (isSelf) refreshUser();
      })
      .catch(() => setAvatarPreview(null))
      .finally(() => setAvatarUploading(false));
  }

  if (loading)
    return <p className="text-center text-muted-foreground py-12">Loading...</p>;
  if (!member)
    return <p className="text-center text-muted-foreground py-12">Member not found</p>;

  const role =
    member.roleId && typeof member.roleId === "object"
      ? (member.roleId as Role)
      : null;

  const avatarSrc = avatarPreview ?? (member.avatar || undefined);

  const presentCount = attendance.length;
  const absentCount = Math.max(0, allActivitiesCount - presentCount);
  const totalCount = allActivitiesCount;
  const presentPct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const absentPct = totalCount > 0 ? Math.round((absentCount / totalCount) * 100) : 0;

  const initials = member.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <>
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        {/* Banner */}
        <div
          className="h-28 w-full"
          style={{
            background: role?.color
              ? `linear-gradient(135deg, ${role.color}40 0%, ${role.color}15 100%)`
              : "linear-gradient(135deg, hsl(var(--muted)) 0%, transparent 100%)",
          }}
        />
        <CardContent className="px-4 sm:px-6 pb-6">
          {/* Avatar row */}
          <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 -mt-12 mb-4">
            <div className="flex items-end gap-3 sm:gap-4">
              {/* Avatar with optional camera overlay for self */}
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                  {avatarSrc && <AvatarImage src={avatarSrc} alt={member.fullName} />}
                  <AvatarFallback
                    className="text-2xl font-bold"
                    style={{
                      backgroundColor: `${role?.color ?? "#64748B"}25`,
                      color: role?.color ?? "#64748B",
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isSelf && (
                  <>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow border-2 border-card hover:bg-primary/80 transition-colors disabled:opacity-60"
                      title="Change photo"
                    >
                      {avatarUploading ? (
                        <span className="h-3 w-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      title="Upload profile photo"
                      onChange={handleAvatarSelect}
                    />
                  </>
                )}
              </div>
              <div className="pb-1">
                {role && (
                  <Badge
                    className="text-xs font-semibold border-0 mb-1"
                    style={{ backgroundColor: `${role.color}20`, color: role.color }}
                  >
                    {role.name}
                  </Badge>
                )}
              </div>
            </div>
            {/* Edit button — only for self */}
            {isSelf && (
              <Button variant="outline" size="sm" onClick={openEditModal} className="gap-1.5 mb-1">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            )}
          </div>

          {/* Name */}
          <h1 className="text-xl sm:text-2xl font-bold font-heading leading-tight">{member.fullName}</h1>

          {/* Details grid */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Hash className="h-4 w-4 shrink-0" />
              <span className="font-mono">{member.studentNumber}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>{member.section ? `BSCPE ${member.section}` : "—"}</span>
            </div>
          </div>

          {/* Role duties */}
          {role?.officialDuties && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
              {role.officialDuties}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">Attendance Summary</h2>
            <span className="ml-auto text-xs text-muted-foreground">{totalCount} total activit{totalCount !== 1 ? "ies" : "y"}</span>
          </div>

          {totalCount === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No activities recorded yet.</p>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-emerald-500/5 border-emerald-500/20 p-4 flex items-center gap-3">
                  <CalendarCheck className="h-8 w-8 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                </div>
                <div className="rounded-xl border bg-red-500/5 border-red-500/20 p-4 flex items-center gap-3">
                  <CalendarX className="h-8 w-8 text-red-400 shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-red-400">{absentCount}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Attendance Rate</span>
                  <span className="font-semibold text-foreground">{presentPct}%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${presentPct}%` }}
                  />
                  <div
                    className="h-full bg-red-400/60 transition-all duration-700"
                    style={{ width: `${absentPct}%` }}
                  />
                </div>
                <div className="flex gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Present {presentPct}%</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-400/60" /> Absent {absentPct}%</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Activity History */}
      {attendance.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-base">Activity Attendance History</h2>
            </div>
            <div className="divide-y">
              {[...attendance]
                .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
                .map((rec) => (
                  <div
                    key={rec.activityId}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/activities/${rec.activityId}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">{rec.activityName}</p>
                      <p className="text-xs text-muted-foreground">{rec.venue} · {formatDate(rec.dateTime)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0 border-emerald-500/30 text-emerald-600"
                    >
                      {rec.method === "self-mark" ? "Self-marked" : rec.method === "qr-scan" ? "QR Scanned" : "Present"}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setShowEdit(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <h2 className="text-lg font-bold font-heading mb-5">Edit Profile</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Middle Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={editForm.middleName}
                  onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
                />
              </div>
              <div>
                <Label>Email <span className="text-muted-foreground text-xs">(not editable)</span></Label>
                <Input value={member.email} disabled className="opacity-60 cursor-not-allowed" />
              </div>
              <div>
                <Label>Student Number</Label>
                <Input
                  value={editForm.studentNumber}
                  onChange={(e) => setEditForm({ ...editForm, studentNumber: e.target.value })}
                  placeholder="e.g. 22-12345"
                />
              </div>
              <div>
                <Label>Section <span className="text-muted-foreground text-xs">(numbers only, e.g. 22001)</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">
                    BSCPE
                  </span>
                  <Input
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                    placeholder="22001"
                    className="pl-16"
                  />
                </div>
              </div>
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editSaving} className="gap-1.5">
                  {editSaving ? (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
