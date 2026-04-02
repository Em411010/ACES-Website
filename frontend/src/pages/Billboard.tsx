import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, AlertCircle } from "lucide-react";
import { announcementsApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Announcement, User, Role } from "@/types";

function getAcknowledgedUserIds(announcement: Announcement) {
  return announcement.acknowledgedBy
    .map((entry) => (typeof entry === "object" ? (entry as User)._id : entry))
    .filter(Boolean) as string[];
}

function getAcknowledgedUsers(announcement: Announcement) {
  return announcement.acknowledgedBy.filter((entry) => typeof entry === "object") as User[];
}

export default function Billboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showAckViewerId, setShowAckViewerId] = useState<string | null>(null);
  const [showPublishCard, setShowPublishCard] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    isMustRead: false,
  });
  const [editAnnouncement, setEditAnnouncement] = useState({
    title: "",
    content: "",
    isMustRead: false,
  });

  const role = typeof user?.roleId === "object" ? (user.roleId as Role) : null;
  const isChairman = role?.name === "Chairman";
  const canPublish =
    isChairman ||
    (Array.isArray(role?.permissions) && role.permissions.includes("PUBLISH_ANNOUNCEMENT"));

  const selectedFromDashboard =
    (location.state as { selectedAnnouncementId?: string } | null)?.selectedAnnouncementId || null;

  const selectedAnnouncementForAckViewer = useMemo(
    () => announcements.find((a) => a._id === showAckViewerId) || null,
    [announcements, showAckViewerId]
  );

  useEffect(() => {
    announcementsApi.getAll().then(setAnnouncements).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedFromDashboard) return;
    setHighlightedId(selectedFromDashboard);

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`announcement-${selectedFromDashboard}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);

    const clear = window.setTimeout(() => {
      setHighlightedId((prev) => (prev === selectedFromDashboard ? null : prev));
    }, 3000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clear);
    };
  }, [selectedFromDashboard]);

  async function handlePublish() {
    const title = newAnnouncement.title.trim();
    const content = newAnnouncement.content.trim();

    if (!title || !content) {
      window.alert("Please fill in both title and content.");
      return;
    }

    try {
      setPublishing(true);
      await announcementsApi.create({
        title,
        content,
        isMustRead: newAnnouncement.isMustRead,
      });
      const updated = await announcementsApi.getAll();
      setAnnouncements(updated);
      setNewAnnouncement({ title: "", content: "", isMustRead: false });
      setShowPublishCard(false);
    } catch {
      window.alert("Failed to publish announcement.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleAcknowledge(id: string) {
    setAcknowledgingId(id);
    try {
      await announcementsApi.acknowledge(id);
      const updated = await announcementsApi.getAll();
      setAnnouncements(updated);
    } finally {
      setAcknowledgingId(null);
    }
  }

  function openEditAnnouncement(a: Announcement) {
    setEditingId(a._id);
    setEditAnnouncement({
      title: a.title,
      content: a.content,
      isMustRead: a.isMustRead,
    });
    setShowEditCard(true);
  }

  async function handleSaveEditAnnouncement() {
    if (!editingId) return;

    const title = editAnnouncement.title.trim();
    const content = editAnnouncement.content.trim();

    if (!title || !content) {
      window.alert("Please fill in both title and content.");
      return;
    }

    try {
      setSavingEdit(true);
      await announcementsApi.update(editingId, {
        title,
        content,
        isMustRead: editAnnouncement.isMustRead,
      });
      const updated = await announcementsApi.getAll();
      setAnnouncements(updated);
      setShowEditCard(false);
      setEditingId(null);
    } catch {
      window.alert("Failed to update announcement.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!isChairman) return;
    const ok = window.confirm("Delete this announcement?");
    if (!ok) return;

    try {
      setDeletingId(id);
      await announcementsApi.remove(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch {
      window.alert("Failed to delete announcement.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-end">
        {canPublish && (
          <button
            onClick={() => setShowPublishCard(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Publish
          </button>
        )}
      </div>

      {showPublishCard && canPublish && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Close publish announcement dialog"
            onClick={() => {
              setShowPublishCard(false);
              setNewAnnouncement({ title: "", content: "", isMustRead: false });
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          <Card className="relative z-50 w-full max-w-2xl border-cyan/30 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Publish Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <input
                  type="text"
                  aria-label="Announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Content</label>
                <textarea
                  aria-label="Announcement content"
                  rows={6}
                  value={newAnnouncement.content}
                  onChange={(e) =>
                    setNewAnnouncement((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  aria-label="Mark as must read"
                  checked={newAnnouncement.isMustRead}
                  onChange={(e) =>
                    setNewAnnouncement((prev) => ({ ...prev, isMustRead: e.target.checked }))
                  }
                />
                Mark as Must Read
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowPublishCard(false);
                    setNewAnnouncement({ title: "", content: "", isMustRead: false });
                  }}
                  className="px-3 py-2 rounded-md border border-input text-sm hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {publishing ? "Publishing..." : "Publish"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditCard && isChairman && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Close edit announcement dialog"
            onClick={() => {
              setShowEditCard(false);
              setEditingId(null);
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          <Card className="relative z-50 w-full max-w-2xl border-cyan/30 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Edit Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <input
                  type="text"
                  aria-label="Edit announcement title"
                  value={editAnnouncement.title}
                  onChange={(e) =>
                    setEditAnnouncement((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Content</label>
                <textarea
                  aria-label="Edit announcement content"
                  rows={6}
                  value={editAnnouncement.content}
                  onChange={(e) =>
                    setEditAnnouncement((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  aria-label="Edit must read"
                  checked={editAnnouncement.isMustRead}
                  onChange={(e) =>
                    setEditAnnouncement((prev) => ({ ...prev, isMustRead: e.target.checked }))
                  }
                />
                Mark as Must Read
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowEditCard(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-2 rounded-md border border-input text-sm hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditAnnouncement}
                  disabled={savingEdit}
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showAckViewerId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Close acknowledged users dialog"
            onClick={() => setShowAckViewerId(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          <Card className="relative z-50 w-full max-w-lg border-cyan/30 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acknowledged By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-auto">
              {selectedAnnouncementForAckViewer && getAcknowledgedUsers(selectedAnnouncementForAckViewer).length > 0 ? (
                getAcknowledgedUsers(selectedAnnouncementForAckViewer).map((u) => {
                  const roleObj = typeof u.roleId === "object" ? (u.roleId as Role) : null;
                  return (
                    <div key={u._id} className="flex items-center justify-between p-2 rounded border border-border">
                      <span className="text-sm font-medium">{u.fullName}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-5 border-0"
                        style={{
                          backgroundColor: `${roleObj?.color}15`,
                          color: roleObj?.color,
                        }}
                      >
                        {roleObj?.name || "Member"}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No one has acknowledged this announcement yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {announcements.map((a) => {
        const author = typeof a.authorId === "object" ? (a.authorId as User) : null;
        const authorRole = author && typeof author.roleId === "object" ? (author.roleId as Role) : null;
        const acknowledgedIds = getAcknowledgedUserIds(a);
        const isAcknowledged = user?._id ? acknowledgedIds.includes(user._id) : false;
        const isBusy = acknowledgingId === a._id;
        return (
          <Card
            id={`announcement-${a._id}`}
            key={a._id}
            className={`transition-all duration-200 hover:shadow-md ${
              a.isMustRead ? "border-destructive/30 ring-1 ring-destructive/10" : ""
            } ${
              highlightedId === a._id ? "ring-2 ring-cyan/60 border-cyan/60" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarFallback
                      className="font-bold text-sm"
                      style={{
                        backgroundColor: `${authorRole?.color}20`,
                        color: authorRole?.color,
                      }}
                    >
                      {author?.fullName
                        ? author.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{author?.fullName}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-0"
                        style={{
                          backgroundColor: `${authorRole?.color}15`,
                          color: authorRole?.color,
                        }}
                      >
                        {authorRole?.name}
                      </Badge>
                      <span>·</span>
                      <Clock size={10} />
                      {new Date(a.createdAt).toLocaleDateString("en-PH", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                {a.isMustRead && (
                  <Badge variant="destructive" className="shrink-0 gap-1">
                    <AlertCircle size={12} />
                    Must Read
                  </Badge>
                )}
                {isChairman && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditAnnouncement(a)}
                      className="px-2 py-0.5 rounded border border-input text-[10px] hover:bg-accent/40"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        void handleDeleteAnnouncement(a._id);
                      }}
                      disabled={deletingId === a._id}
                      className="px-2 py-0.5 rounded border border-destructive/40 text-destructive text-[10px] hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {deletingId === a._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
              <CardTitle className="text-lg mt-3">{a.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {a.content.replace(/[#*]/g, "")}
              </p>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{acknowledgedIds.length} acknowledged</span>
                  <button
                    onClick={() => setShowAckViewerId(a._id)}
                    className="px-2.5 py-1 rounded border border-input text-[11px] hover:bg-accent/40"
                  >
                    View
                  </button>
                </div>
                <div>
                  {a.isMustRead && (
                    <button
                      onClick={() => handleAcknowledge(a._id)}
                      disabled={isAcknowledged || isBusy}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAcknowledged ? "Acknowledged" : isBusy ? "Saving..." : "I Acknowledge"}
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
