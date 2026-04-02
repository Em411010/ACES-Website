import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Users, X, ImageIcon } from "lucide-react";
import { activitiesApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import type { Activity, Role } from "@/types";

export default function Activities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.roleId && typeof user.roleId === "object" ? (user.roleId as Role) : null;
  const perms = role?.permissions ?? [];
  const canManage = perms.includes("MANAGE_ACTIVITIES");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [form, setForm] = useState({ name: "", venue: "", dateTime: "", description: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      const data = await activitiesApi.getAll();
      setActivities(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.venue || !form.dateTime) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("venue", form.venue);
      fd.append("dateTime", form.dateTime);
      fd.append("description", form.description);
      if (imageFile) fd.append("image", imageFile);
      await activitiesApi.create(fd);
      setForm({ name: "", venue: "", dateTime: "", description: "" });
      setImageFile(null);
      setShowCreate(false);
      loadActivities();
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const upcoming = activities.filter((a) => new Date(a.dateTime) >= new Date());
  const past = activities.filter((a) => new Date(a.dateTime) < new Date());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading">Activities</h1>
          <p className="text-sm text-muted-foreground">Events and activities with attendance tracking</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> New Activity
          </Button>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-card border rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <button onClick={() => setShowCreate(false)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors" aria-label="Close">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <h2 className="text-lg font-bold font-heading mb-4">Create Activity</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Activity Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. General Assembly" required />
              </div>
              <div>
                <Label>Venue *</Label>
                <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Room 301, Main Building" required />
              </div>
              <div>
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={form.dateTime} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Activity details..." rows={3} />
              </div>
              <div>
                <Label>Image (optional)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Activity"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading activities...</p>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No activities yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h2>
              <div className="grid gap-3">
                {upcoming.map((a) => (
                  <Card
                    key={a._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/activities/${a._id}`)}
                  >
                    <CardContent className="p-4 flex gap-4">
                      {a.image ? (
                        <img
                          src={a.image}
                          alt=""
                          className="hidden sm:block h-20 w-28 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="hidden sm:flex h-20 w-28 bg-muted rounded-lg items-center justify-center shrink-0">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold truncate text-sm sm:text-base">{a.name}</h3>
                          <Badge variant="outline" className="shrink-0 text-xs border-green-500/30 text-green-600">Upcoming</Badge>
                        </div>
                        <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{a.venue}</div>
                          <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{formatDate(a.dateTime)}</div>
                          <div className="flex items-center gap-1.5"><Users className="h-3 w-3" />{a.attendance?.length ?? 0} attendees</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Past</h2>
              <div className="grid gap-3">
                {past.map((a) => (
                  <Card
                    key={a._id}
                    className="cursor-pointer hover:shadow-md transition-shadow opacity-80"
                    onClick={() => navigate(`/activities/${a._id}`)}
                  >
                    <CardContent className="p-4 flex gap-4">
                      {a.image ? (
                        <img
                          src={a.image}
                          alt=""
                          className="hidden sm:block h-20 w-28 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="hidden sm:flex h-20 w-28 bg-muted rounded-lg items-center justify-center shrink-0">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold truncate text-sm sm:text-base">{a.name}</h3>
                          <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">Past</Badge>
                        </div>
                        <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{a.venue}</div>
                          <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{formatDate(a.dateTime)}</div>
                          <div className="flex items-center gap-1.5"><Users className="h-3 w-3" />{a.attendance?.length ?? 0} attendees</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
