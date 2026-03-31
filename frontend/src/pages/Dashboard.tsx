import {
  Users,
  KanbanSquare,
  Megaphone,
  CalendarDays,
  TrendingUp,
  Clock,
  AlertCircle,
  BellRing,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CircuitPattern } from "@/components/ui/circuit-pattern";
import {
  currentUser,
  currentRole,
  mockAnnouncements,
  mockTasks,
  mockUsers,
  getUserById,
  getRoleById,
} from "@/data/mock";

function StatCard({
  label,
  value,
  icon: Icon,
  accent = "cyan",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: "cyan" | "gold" | "success" | "warning";
}) {
  const accentMap = {
    cyan: "text-cyan bg-cyan/10",
    gold: "text-gold bg-gold/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
  };

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold font-heading mt-1">{value}</p>
          </div>
          <div
            className={`p-2.5 rounded-lg ${accentMap[accent]} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
      <CircuitPattern className="absolute -bottom-8 -right-8 w-32 h-32 text-cyan opacity-30 pointer-events-none" />
    </Card>
  );
}

export default function Dashboard() {
  const { user, dismissProfileUpdate } = useAuth();
  const totalTasks = mockTasks.length;
  const doneTasks = mockTasks.filter((t) => t.status === "done").length;
  const taskProgress = Math.round((doneTasks / totalTasks) * 100);
  const unreadAnnouncements = mockAnnouncements.filter(
    (a) => a.isMustRead && !a.acknowledgedBy.includes(currentUser._id)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Profile Update Pending Banner */}
      {user?.profileUpdatePending && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <BellRing size={18} className="text-gold shrink-0" />
            <p className="text-sm text-gold-foreground">
              <span className="font-semibold text-gold">Action required:</span>{" "}
              Please update your profile information for the new semester.
            </p>
          </div>
          <button
            onClick={() => dismissProfileUpdate()}
            className="shrink-0 rounded p-1 text-gold/70 hover:text-gold hover:bg-gold/20 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <Card className="relative overflow-hidden border-gold/20 bg-gradient-to-r from-navy via-navy-light to-navy">
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-gold/50">
              <AvatarFallback className="bg-gold/20 text-gold text-lg font-bold font-heading">
                {currentUser.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-gold/70 text-sm">Welcome back,</p>
              <h2 className="text-2xl font-bold font-heading text-white">
                {currentUser.fullName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className="text-xs font-semibold border-0"
                  style={{
                    backgroundColor: `${currentRole.color}30`,
                    color: currentRole.color,
                  }}
                >
                  {currentRole.name}
                </Badge>
                <span className="text-white/40 text-xs">
                  {currentUser.studentNumber} · Year {currentUser.yearLevel}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CircuitPattern className="absolute inset-0 w-full h-full text-cyan" />
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={mockUsers.length}
          icon={Users}
          accent="cyan"
        />
        <StatCard
          label="Active Tasks"
          value={mockTasks.filter((t) => t.status !== "done").length}
          icon={KanbanSquare}
          accent="gold"
        />
        <StatCard
          label="Announcements"
          value={mockAnnouncements.length}
          icon={Megaphone}
          accent="success"
        />
        <StatCard
          label="Unread Must-Read"
          value={unreadAnnouncements}
          icon={AlertCircle}
          accent="warning"
        />
      </div>

      {/* Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Announcements */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <Megaphone size={18} className="text-cyan" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAnnouncements.map((announcement) => {
              const author = getUserById(announcement.authorId);
              const authorRole = author ? getRoleById(author.roleId) : undefined;
              return (
                <div
                  key={announcement._id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-cyan/30 hover:bg-accent/5 transition-all duration-200 cursor-pointer group"
                >
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarFallback
                      className="text-xs font-bold"
                      style={{
                        backgroundColor: `${authorRole?.color}20`,
                        color: authorRole?.color,
                      }}
                    >
                      {author?.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold truncate group-hover:text-cyan transition-colors">
                        {announcement.title}
                      </h4>
                      {announcement.isMustRead && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                          Must Read
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {announcement.content.replace(/[#*]/g, "")}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted-foreground/70">
                        {author?.fullName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">·</span>
                      <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(announcement.createdAt).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Task Progress */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <TrendingUp size={18} className="text-gold" />
              Engineering Week 2026
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Ring */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-muted"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={`${taskProgress * 2.136} 213.6`}
                    strokeLinecap="round"
                    className="text-gold"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold font-heading">{taskProgress}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {doneTasks} of {totalTasks} tasks done
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  April 14-18, 2026
                </p>
              </div>
            </div>

            {/* Task Status Breakdown */}
            <div className="space-y-2">
              {[
                { label: "To Do", status: "todo" as const, color: "bg-muted-foreground" },
                { label: "In Progress", status: "in-progress" as const, color: "bg-cyan" },
                { label: "Review", status: "review" as const, color: "bg-warning" },
                { label: "Done", status: "done" as const, color: "bg-success" },
              ].map(({ label, status, color }) => {
                const count = mockTasks.filter((t) => t.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>

            <Progress value={taskProgress} className="h-2" />

            {/* Upcoming Deadlines */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Upcoming Deadlines
              </p>
              {mockTasks
                .filter((t) => t.status !== "done")
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .slice(0, 3)
                .map((task) => {
                  const daysLeft = Math.ceil(
                    (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={task._id}
                      className="flex items-center justify-between py-1.5 text-sm"
                    >
                      <span className="truncate flex-1 mr-2">{task.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          daysLeft <= 3
                            ? "border-destructive/50 text-destructive"
                            : daysLeft <= 7
                              ? "border-warning/50 text-warning"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        <CalendarDays size={10} className="mr-1" />
                        {daysLeft}d
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
