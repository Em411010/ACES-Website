import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, Moon, Sun, Check, CheckCheck, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState, useCallback } from "react";
import { notificationsApi } from "@/services/api";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/GlobalSearch";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/billboard": "Billboard",
  "/tasks": "Task Board",
  "/documents": "Document Vault",
  "/chain": "Chain of Command",
  "/id": "Digital ID",
  "/admin/roles": "Role Manager",
  "/admin/members": "Member Directory",
  "/admin/audit": "Audit Trail",
};

const NOTIFICATION_ICONS: Record<string, { emoji: string; color: string }> = {
  TASK_ASSIGNED: { emoji: "📋", color: "bg-blue-500/20 text-blue-400" },
  TASK_STATUS_CHANGED: { emoji: "🔄", color: "bg-sky-500/20 text-sky-400" },
  NEW_ANNOUNCEMENT: { emoji: "📢", color: "bg-amber-500/20 text-amber-400" },
  MUST_READ_ANNOUNCEMENT: { emoji: "🔴", color: "bg-red-500/20 text-red-400" },
  ROLE_CHANGED: { emoji: "🛡️", color: "bg-purple-500/20 text-purple-400" },
  REGISTRATION_APPROVED: { emoji: "✅", color: "bg-emerald-500/20 text-emerald-400" },
  PROFILE_UPDATE_REQUESTED: { emoji: "✏️", color: "bg-orange-500/20 text-orange-400" },
  CHAIRMANSHIP_TRANSFERRED: { emoji: "👑", color: "bg-gold/20 text-gold" },
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function TopBar({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/activities/") ? "Activity Detail" : 
     location.pathname.startsWith("/members/") ? "Member Profile" : "ACES");

  function toggleTheme() {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  }

  // Poll unread count every 30 seconds
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Fetch full list when panel opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    notificationsApi
      .getAll({ limit: 30 })
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await notificationsApi.markRead(id).catch(() => {});
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await notificationsApi.markAllRead().catch(() => {});
  }

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) handleMarkRead(n._id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  }

  return (
    <header className="h-14 md:h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-3 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        {/* Hamburger menu for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={onMobileMenuToggle}
        >
          <Menu size={20} />
        </Button>
        <h2 className="text-base md:text-lg font-bold font-heading text-foreground truncate">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={18} />
        </Button>
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
        >
          <Search size={14} className="opacity-50" />
          <span className="text-muted-foreground/70">Search or jump to…</span>
          <kbd className="ml-auto inline-flex items-center rounded border border-border/60 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/50">Ctrl K</kbd>
        </button>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground relative"
            onClick={() => setOpen((v) => !v)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground border-2 border-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Dropdown Panel */}
          {open && (
            <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-96 max-w-[384px] rounded-xl border border-border bg-background shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                    onClick={handleMarkAllRead}
                  >
                    <CheckCheck size={14} className="mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>

              {/* Notification List */}
              <ScrollArea className="max-h-[420px]">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bell size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((n, i) => {
                      const icon = NOTIFICATION_ICONS[n.type] || {
                        emoji: "🔔",
                        color: "bg-muted text-muted-foreground",
                      };
                      return (
                        <div key={n._id}>
                          <div
                            className={cn(
                              "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50",
                              !n.isRead && "bg-gold/[0.03]"
                            )}
                            onClick={() => handleNotificationClick(n)}
                          >
                            {/* Icon */}
                            <Avatar className={cn("h-9 w-9 shrink-0 text-base", icon.color)}>
                              <AvatarFallback className={cn("text-base", icon.color)}>
                                {icon.emoji}
                              </AvatarFallback>
                            </Avatar>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "text-xs font-semibold truncate",
                                  !n.isRead ? "text-foreground" : "text-muted-foreground"
                                )}>
                                  {n.title}
                                </p>
                                {!n.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-gold shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1">
                                {timeAgo(n.createdAt)}
                              </p>
                            </div>

                            {/* Mark read */}
                            {!n.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-gold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkRead(n._id);
                                }}
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </Button>
                            )}
                          </div>
                          {i < notifications.length - 1 && (
                            <Separator className="bg-border/50" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
