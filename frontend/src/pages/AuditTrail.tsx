import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Shield,
  Megaphone,
  CalendarCheck,
  FileText,
  KanbanSquare,
  GitBranch,
  ScanLine,
  LogIn,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auditLogsApi } from "@/services/api";

/* ─── Types ─────────────────────────────────────────── */
interface AuditLogEntry {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    avatar?: string;
    roleId?: { name: string; color: string };
  } | null;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  details: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

interface AuditResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

/* ─── Module icons & colors ─────────────────────────── */
const MODULE_META: Record<string, { icon: typeof Shield; color: string; bg: string }> = {
  AUTH: { icon: LogIn, color: "text-blue-400", bg: "bg-blue-500/15" },
  USER: { icon: User, color: "text-cyan", bg: "bg-cyan/15" },
  ROLE: { icon: Shield, color: "text-amber-400", bg: "bg-amber-500/15" },
  ACTIVITY: { icon: CalendarCheck, color: "text-green-400", bg: "bg-green-500/15" },
  ANNOUNCEMENT: { icon: Megaphone, color: "text-purple-400", bg: "bg-purple-500/15" },
  DOCUMENT: { icon: FileText, color: "text-orange-400", bg: "bg-orange-500/15" },
  TASK: { icon: KanbanSquare, color: "text-pink-400", bg: "bg-pink-500/15" },
  EVENT: { icon: GitBranch, color: "text-indigo-400", bg: "bg-indigo-500/15" },
  ATTENDANCE: { icon: ScanLine, color: "text-teal-400", bg: "bg-teal-500/15" },
};

/* ─── Format helpers ─────────────────────────────────── */
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

/* ─── Action label ───────────────────────────────────── */
function humanAction(action: string) {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const MODULES = ["AUTH", "USER", "ROLE", "ACTIVITY", "ANNOUNCEMENT", "DOCUMENT", "TASK", "EVENT", "ATTENDANCE"];

export default function AuditTrail() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 50 };
      if (search) params.search = search;
      if (moduleFilter) params.module = moduleFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await auditLogsApi.getAll(params);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, moduleFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, moduleFilter, fromDate, toDate]);

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-gold">Audit Trail</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete system activity log — {data?.total ?? 0} total entries
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Search + Filters */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9 h-9 bg-background/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={14} />
              <span className="ml-2">Filters</span>
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-1">
              {/* Module filter */}
              <select
                aria-label="Filter by module"
                className="h-9 rounded-md border border-border bg-background/50 px-3 text-sm text-foreground"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="">All Modules</option>
                {MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0) + m.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>

              {/* Date range */}
              <Input
                type="date"
                className="h-9 w-auto bg-background/50"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From"
              />
              <span className="text-muted-foreground self-center text-xs">to</span>
              <Input
                type="date"
                className="h-9 w-auto bg-background/50"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To"
              />

              {(moduleFilter || fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => {
                    setModuleFilter("");
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Legend */}
      <div className="flex flex-wrap gap-2">
        {MODULES.map((m) => {
          const meta = MODULE_META[m];
          if (!meta) return null;
          const Icon = meta.icon;
          const isActive = moduleFilter === m;
          return (
            <button
              key={m}
              onClick={() => setModuleFilter(isActive ? "" : m)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? `${meta.bg} ${meta.color} ring-1 ring-current`
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Icon size={12} />
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border/50" />

        {loading && logs.length === 0 ? (
          <div className="flex justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No audit log entries found.
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, i) => {
              const meta = MODULE_META[log.module] ?? MODULE_META.AUTH;
              const Icon = meta.icon;
              const user = log.userId;
              const initials = user
                ? user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                : "?";

              // Date separator
              const prevLog = i > 0 ? logs[i - 1] : null;
              const showDateSep =
                !prevLog || formatDate(log.createdAt) !== formatDate(prevLog.createdAt);

              return (
                <div key={log._id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 pl-3 py-3">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center z-10">
                        <Clock size={10} className="text-muted-foreground" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-3 pl-3 py-2 hover:bg-muted/20 rounded-lg transition-colors group">
                    {/* Module icon dot */}
                    <div
                      className={`w-5 h-5 rounded-full ${meta.bg} flex items-center justify-center z-10 shrink-0 mt-0.5`}
                    >
                      <Icon size={10} className={meta.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* User avatar */}
                        {user && (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              {user.avatar && <AvatarImage src={user.avatar} />}
                              <AvatarFallback className="text-[8px] bg-navy-light text-gold font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">
                              {user.fullName}
                            </span>
                            {user.roleId && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0"
                                style={{
                                  borderColor: user.roleId.color,
                                  color: user.roleId.color,
                                }}
                              >
                                {user.roleId.name}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {log.details || humanAction(log.action)}
                      </p>

                      {/* Tags */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`${meta.bg} ${meta.color} border-0 text-[9px] px-1.5 py-0`}>
                          {log.module}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground border-border/50">
                          {humanAction(log.action)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatTime(log.createdAt)} · {timeAgo(log.createdAt)}
                        </span>
                        {log.ip && (
                          <span className="text-[10px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            IP: {log.ip}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <>
          <Separator />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Page {data.page} of {data.totalPages} · Showing {logs.length} of {data.total}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
