import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QrScannerModal from "@/components/QrScannerModal";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  QrCode,
  CheckCircle2,
  UserCheck,
  Shield,
  Pencil,
  Trash2,
  X,
  ImageIcon,
  Download,
  Search,
} from "lucide-react";
import { activitiesApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import type { Activity, Role, User } from "@/types";

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.roleId && typeof user.roleId === "object" ? (user.roleId as Role) : null;
  const perms = role?.permissions ?? [];
  const canManage = perms.includes("MANAGE_ACTIVITIES");
  const canScan = perms.includes("SCAN_ATTENDANCE");

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanInput, setScanInput] = useState("");
  const [scanMsg, setScanMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selfMarking, setSelfMarking] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Search filters
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // Edit form
  const [editForm, setEditForm] = useState({ name: "", venue: "", dateTime: "", description: "" });
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (id) loadActivity();
  }, [id]);

  async function loadActivity() {
    try {
      const data = await activitiesApi.getById(id!);
      setActivity(data);
      setEditForm({
        name: data.name,
        venue: data.venue,
        dateTime: new Date(data.dateTime).toISOString().slice(0, 16),
        description: data.description,
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  const isPresent = activity?.attendance?.some(
    (a) => (typeof a.userId === "object" ? (a.userId as User)._id : a.userId) === user?._id
  );

  async function handleSelfMark() {
    setSelfMarking(true);
    try {
      const updated = await activitiesApi.selfMark(id!);
      setActivity(updated);
      setScanMsg({ type: "success", text: "You've been marked present!" });
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error || "Failed to self-mark";
      setScanMsg({ type: "error", text: msg });
    } finally {
      setSelfMarking(false);
    }
  }

  async function handleScan(hash?: string) {
    const value = hash ?? scanInput.trim();
    if (!value) return;
    setScanMsg(null);
    try {
      const result = await activitiesApi.scanQR(id!, value);
      setActivity(result.activity);
      setScanMsg({ type: "success", text: `${result.scannedUser.fullName} marked present!` });
      setScanInput("");
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error || "Scan failed";
      setScanMsg({ type: "error", text: msg });
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", editForm.name);
      fd.append("venue", editForm.venue);
      fd.append("dateTime", editForm.dateTime);
      fd.append("description", editForm.description);
      if (editImage) fd.append("image", editImage);
      const updated = await activitiesApi.update(id!, fd);
      setActivity(updated);
      setShowEdit(false);
    } catch {
      /* ignore */
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await activitiesApi.remove(id!);
      navigate("/activities");
    } catch {
      /* ignore */
    }
  }

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatShort(dt: string) {
    return new Date(dt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function exportAttendance() {
    if (!activity) return;
    const rows = activity.attendance.map((rec, i) => {
      const u = typeof rec.userId === "object" ? (rec.userId as User) : null;
      return {
        "No.": i + 1,
        "Student Number": u?.studentNumber ?? "",
        "Section": u?.section ? `BSCPE ${u.section}` : "",
        "Name": u?.fullName ?? "Unknown",
        "Email": u?.email ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    // Column widths
    ws["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 34 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    const safeName = activity.name.replace(/[/\\?%*:|"<>]/g, "-");
    XLSX.writeFile(wb, `${safeName} - Attendance.xlsx`);
  }

  if (loading) return <p className="text-center text-muted-foreground py-12">Loading...</p>;
  if (!activity) return <p className="text-center text-muted-foreground py-12">Activity not found</p>;

  const isPast = new Date(activity.dateTime) < new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/activities")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Activities
      </Button>

      {/* Header Card */}
      <Card className="overflow-hidden">
        {activity.image ? (
          <div
            className="relative w-full cursor-zoom-in group h-48 sm:h-72 md:h-96 lg:h-[480px]"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={activity.image}
              alt={activity.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
                Click to view full screen
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-muted flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold font-heading">{activity.name}</h1>
                <Badge variant={isPast ? "secondary" : "outline"} className={isPast ? "" : "border-green-500/30 text-green-600"}>
                  {isPast ? "Past" : "Upcoming"}
                </Badge>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{activity.venue}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{formatDate(activity.dateTime)}</div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4" />{activity.attendance.length} attendee{activity.attendance.length !== 1 ? "s" : ""}</div>
              </div>
              {activity.description && (
                <p className="mt-4 text-sm leading-relaxed">{activity.description}</p>
              )}
            </div>
            {canManage && (
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon" onClick={() => setShowEdit(true)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Bar for executives */}
      {canScan && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Self-mark */}
              {!isPresent ? (
                <Button size="sm" variant="outline" onClick={handleSelfMark} disabled={selfMarking} className="gap-1.5">
                  <UserCheck className="h-4 w-4" />
                  {selfMarking ? "Marking..." : "Mark Myself Present"}
                </Button>
              ) : (
                <Badge variant="outline" className="gap-1 text-green-600 border-green-500/30 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> You're marked present
                </Badge>
              )}
            </div>

            {/* QR Scan — camera button + manual fallback */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => { setScanMsg(null); setShowScanner(true); }}
              >
                <QrCode className="h-4 w-4" /> Open QR Scanner
              </Button>
              <div className="flex gap-2">
                <Input
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  placeholder="Or paste Digital ID hash manually..."
                  className="text-xs"
                />
                <Button onClick={() => handleScan()} size="sm" variant="secondary">
                  Submit
                </Button>
              </div>
            </div>

            {scanMsg && (
              <p className={`text-sm font-medium ${scanMsg.type === "success" ? "text-green-600" : "text-destructive"}`}>
                {scanMsg.text}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs: Attendance + Audit Logs */}
      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Attendance ({activity.attendance.length})</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Audit Logs ({activity.auditLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardContent className="p-0">
              {/* Search + Export toolbar */}
              <div className="flex items-center gap-2 p-3 border-b">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    placeholder="Search by name, student no., or section..."
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                {activity.attendance.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={exportAttendance}>
                    <Download className="h-3.5 w-3.5" /> Export Excel
                  </Button>
                )}
              </div>
              {activity.attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet.</p>
              ) : (() => {
                const q = attendanceSearch.trim().toLowerCase();
                const filtered = activity.attendance.filter((rec) => {
                  if (!q) return true;
                  const u = typeof rec.userId === "object" ? (rec.userId as User) : null;
                  return (
                    u?.fullName?.toLowerCase().includes(q) ||
                    u?.studentNumber?.toLowerCase().includes(q) ||
                    u?.section?.toLowerCase().includes(q) ||
                    u?.email?.toLowerCase().includes(q)
                  );
                });
                return filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No matching records.</p>
                ) : (
                <div className="divide-y">
                  {filtered.map((rec, i) => {
                    const u = typeof rec.userId === "object" ? (rec.userId as User) : null;
                    const markedBy = typeof rec.markedBy === "object" ? (rec.markedBy as User) : null;
                    const uRole = u?.roleId && typeof u.roleId === "object" ? (u.roleId as Role) : null;
                    const markedByRole = markedBy?.roleId && typeof markedBy.roleId === "object" ? (markedBy.roleId as Role) : null;
                    return (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: `${uRole?.color ?? "#64748B"}20`, color: uRole?.color ?? "#64748B" }}
                          >
                            {u?.fullName?.split(" ").map((n) => n[0]).join("") ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u?.fullName ?? "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {u?.section ? `BSCPE ${u.section}` : ""}{u?.section && u?.email ? " · " : ""}{u?.email ?? ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            {rec.method === "self-mark" ? "Self-marked" : "QR Scanned"}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {markedBy?.fullName ? `by ${markedBy.fullName}${markedByRole?.name ? ` (${markedByRole.name})` : ""}` : ""} · {formatShort(rec.markedAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="p-0">
              {/* Audit search toolbar */}
              <div className="flex items-center gap-2 p-3 border-b">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search by performer or target name..."
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
              {activity.auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No audit logs yet.</p>
              ) : (() => {
                const q = auditSearch.trim().toLowerCase();
                const filtered = [...activity.auditLogs].reverse().filter((log) => {
                  if (!q) return true;
                  const performer = typeof log.performedBy === "object" ? (log.performedBy as User) : null;
                  const target = log.targetUser && typeof log.targetUser === "object" ? (log.targetUser as User) : null;
                  return (
                    performer?.fullName?.toLowerCase().includes(q) ||
                    target?.fullName?.toLowerCase().includes(q) ||
                    log.action?.toLowerCase().includes(q) ||
                    log.details?.toLowerCase().includes(q)
                  );
                });
                return filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No matching logs.</p>
                ) : (
                <div className="divide-y">
                  {filtered.map((log, i) => {
                    const performer = typeof log.performedBy === "object" ? (log.performedBy as User) : null;
                    const target = log.targetUser && typeof log.targetUser === "object" ? (log.targetUser as User) : null;
                    const performerRole = performer?.roleId && typeof performer.roleId === "object" ? (performer.roleId as Role) : null;
                    const targetRole = target?.roleId && typeof target.roleId === "object" ? (target.roleId as Role) : null;
                    return (
                      <div key={i} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-mono">{log.action}</Badge>
                          <span className="text-xs text-muted-foreground">{formatShort(log.timestamp)}</span>
                        </div>
                        <p className="text-sm mt-1">{log.details}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          By: {performer?.fullName ?? "System"}{performerRole?.name ? ` (${performerRole.name})` : ""}
                          {target ? ` → ${target.fullName}${targetRole?.name ? ` (${targetRole.name})` : ""}` : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEdit(false)} />
          <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <button onClick={() => setShowEdit(false)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors" aria-label="Close">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <h2 className="text-lg font-bold font-heading mb-4">Edit Activity</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label>Activity Name *</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <Label>Venue *</Label>
                <Input value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} required />
              </div>
              <div>
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={editForm.dateTime} onChange={(e) => setEditForm({ ...editForm, dateTime: e.target.value })} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
              </div>
              <div>
                <Label>Replace Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files?.[0] ?? null)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
                <Button type="submit" disabled={editSubmitting}>{editSubmitting ? "Saving..." : "Save Changes"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <h3 className="text-lg font-bold">Delete Activity?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This will permanently delete <strong>{activity.name}</strong> and all its attendance records.
            </p>
            <div className="flex justify-center gap-3 mt-5">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QrScannerModal
          onScan={(hash) => {
            setShowScanner(false);
            handleScan(hash);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Lightbox / Fullscreen Image */}
      {lightboxOpen && activity.image && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={activity.image}
            alt={activity.name}
            className="max-h-[92vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
