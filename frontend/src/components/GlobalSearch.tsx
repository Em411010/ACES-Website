import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  LayoutDashboard,
  Megaphone,
  KanbanSquare,
  FileText,
  CalendarCheck,
  GitBranch,
  CreditCard,
  Shield,
  Users,
  ScrollText,
  ArrowRight,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { searchApi, type SearchResult } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/* ── Navigation pages (mirrors sidebar) ─────────────────────────────── */
interface PageItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  keywords: string[];
  admin?: boolean;
}

const PAGES: PageItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "stats"] },
  { label: "Billboard", href: "/billboard", icon: Megaphone, keywords: ["announcements", "news", "posts", "publish"] },
  { label: "Task Board", href: "/tasks", icon: KanbanSquare, keywords: ["tasks", "kanban", "todo", "assignments"] },
  { label: "Document Vault", href: "/documents", icon: FileText, keywords: ["documents", "files", "pdf", "upload"] },
  { label: "Activities", href: "/activities", icon: CalendarCheck, keywords: ["events", "attendance", "activities"] },
  { label: "Chain of Command", href: "/chain", icon: GitBranch, keywords: ["hierarchy", "org chart", "officers", "chain"] },
  { label: "Digital ID", href: "/id", icon: CreditCard, keywords: ["id", "qr", "card", "membership"] },
  { label: "Role Manager", href: "/admin/roles", icon: Shield, keywords: ["roles", "permissions", "admin"], admin: true },
  { label: "Member Directory", href: "/admin/members", icon: Users, keywords: ["members", "users", "directory", "admin"], admin: true },
  { label: "Audit Trail", href: "/admin/audit", icon: ScrollText, keywords: ["audit", "logs", "history", "admin"], admin: true },
];

/* ── Content result type metadata ───────────────────────────────────── */
const CONTENT_META: Record<string, { icon: typeof Users; color: string }> = {
  member: { icon: Users, color: "text-blue-500" },
  announcement: { icon: Megaphone, color: "text-amber-500" },
  task: { icon: ClipboardList, color: "text-emerald-500" },
  document: { icon: FileText, color: "text-red-400" },
  activity: { icon: CalendarDays, color: "text-purple-500" },
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-blue-500/15 text-blue-500",
  review: "bg-amber-500/15 text-amber-500",
  done: "bg-emerald-500/15 text-emerald-500",
};

/* ── Unified item type for keyboard nav ────────────────────────────── */
type ListItem =
  | { kind: "page"; page: PageItem }
  | { kind: "result"; result: SearchResult };

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const perms = user?.roleId?.permissions ?? [];
  const isAdmin = perms.length > 0;

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced API search
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchApi.query(q.trim());
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setActiveIdx(0);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  // ── Build unified flat list ─────────────────────────────────────────
  const q = query.toLowerCase().trim();

  const filteredPages = q
    ? PAGES.filter((p) => {
        if (p.admin && !isAdmin) return false;
        return (
          p.label.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.includes(q))
        );
      })
    : PAGES.filter((p) => !p.admin || isAdmin);

  const items: ListItem[] = [
    ...filteredPages.map((p) => ({ kind: "page" as const, page: p })),
    ...results.map((r) => ({ kind: "result" as const, result: r })),
  ];

  const hasPages = filteredPages.length > 0;
  const hasResults = results.length > 0;

  // ── Keyboard navigation ─────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[activeIdx]) {
      e.preventDefault();
      selectItem(items[activeIdx]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  function selectItem(item: ListItem) {
    onClose();
    if (item.kind === "page") {
      navigate(item.page.href);
    } else {
      const r = item.result;
      if (r.linkState) navigate(r.link, { state: r.linkState });
      else navigate(r.link);
    }
  }

  if (!open) return null;

  let idx = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[14vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-3 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* ── Input ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-border">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Where do you want to go?"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          {query && (
            <button
              onClick={() => handleInputChange("")}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Clear"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60">
            ESC
          </kbd>
        </div>

        {/* ── List ──────────────────────────────────────────────────── */}
        <div ref={listRef} className="max-h-[min(60vh,420px)] overflow-y-auto py-1">

          {/* Pages section */}
          {hasPages && (
            <>
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                  {q ? "Pages" : "Go to"}
                </span>
              </div>
              {filteredPages.map((p) => {
                const i = idx++;
                const Icon = p.icon;
                return (
                  <div
                    key={p.href}
                    data-idx={i}
                    className={cn(
                      "flex items-center gap-3 mx-1 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      i === activeIdx ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted/60"
                    )}
                    onClick={() => selectItem({ kind: "page", page: p })}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <Icon size={16} className={cn("shrink-0", i === activeIdx ? "text-accent-foreground" : "text-muted-foreground")} />
                    <span className="text-sm flex-1 truncate">{p.label}</span>
                    {p.admin && (
                      <span className="text-[10px] text-muted-foreground/40 font-medium">Admin</span>
                    )}
                    <ArrowRight size={12} className={cn("shrink-0 transition-opacity", i === activeIdx ? "opacity-60" : "opacity-0")} />
                  </div>
                );
              })}
            </>
          )}

          {/* Divider between pages and results */}
          {hasPages && hasResults && (
            <div className="mx-3 my-1 border-t border-border/50" />
          )}

          {/* Content results section */}
          {hasResults && (
            <>
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                  Results
                </span>
              </div>
              {results.map((r) => {
                const i = idx++;
                const meta = CONTENT_META[r.type];
                const Icon = meta?.icon ?? Search;
                const iconColor = meta?.color ?? "text-muted-foreground";
                return (
                  <div
                    key={`${r.type}-${r.id}`}
                    data-idx={i}
                    className={cn(
                      "flex items-center gap-3 mx-1 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      i === activeIdx ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted/60"
                    )}
                    onClick={() => selectItem({ kind: "result", result: r })}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    {/* Icon / Avatar */}
                    {r.type === "member" ? (
                      <Avatar className="h-7 w-7 shrink-0">
                        {r.avatar && <AvatarImage src={r.avatar} />}
                        <AvatarFallback
                          className="text-[10px] font-bold"
                          style={{
                            backgroundColor: r.role ? `${r.role.color}20` : undefined,
                            color: r.role?.color,
                          }}
                        >
                          {r.title.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Icon size={16} className={cn("shrink-0", i === activeIdx ? "text-accent-foreground" : iconColor)} />
                    )}

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.subtitle}</p>
                    </div>

                    {/* Trailing badges */}
                    {r.type === "member" && r.role && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 border-0 shrink-0"
                        style={{ backgroundColor: `${r.role.color}15`, color: r.role.color }}
                      >
                        {r.role.name}
                      </Badge>
                    )}
                    {r.type === "task" && r.status && (
                      <Badge className={cn("text-[9px] px-1.5 py-0 h-4 border-0 shrink-0", STATUS_COLORS[r.status] || "")}>
                        {r.status}
                      </Badge>
                    )}
                    {r.type === "announcement" && r.isMustRead && (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                        Must Read
                      </Badge>
                    )}

                    <ArrowRight size={12} className={cn("shrink-0 transition-opacity", i === activeIdx ? "opacity-60" : "opacity-0")} />
                  </div>
                );
              })}
            </>
          )}

          {/* Loading */}
          {loading && results.length === 0 && q.length >= 2 && (
            <div className="flex items-center justify-center py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* No results */}
          {!loading && q.length >= 2 && !hasResults && !hasPages && (
            <div className="py-8 text-center text-sm text-muted-foreground/60">
              Nothing found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 py-1.5 border-t border-border/50 text-[10px] text-muted-foreground/40">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-px font-mono">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-px font-mono">↵</kbd> open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-px font-mono">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
