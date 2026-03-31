import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, GripVertical } from "lucide-react";
import { mockTasks, getUserById, getRoleById } from "@/data/mock";

const columns = [
  { id: "todo" as const, label: "To Do", color: "bg-muted-foreground" },
  { id: "in-progress" as const, label: "In Progress", color: "bg-cyan" },
  { id: "review" as const, label: "Review", color: "bg-warning" },
  { id: "done" as const, label: "Done", color: "bg-success" },
];

export default function Tasks() {
  const total = mockTasks.length;
  const done = mockTasks.filter((t) => t.status === "done").length;
  const progress = Math.round((done / total) * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm text-muted-foreground font-medium">
            Engineering Week 2026
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <Progress value={progress} className="h-2 w-48" />
            <span className="text-sm font-semibold">{progress}%</span>
          </div>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          + New Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const tasks = mockTasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {tasks.length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30 border border-dashed border-border">
                {tasks.map((task) => {
                  const daysLeft = Math.ceil(
                    (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Card
                      key={task._id}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow duration-200 group"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical
                            size={14}
                            className="text-muted-foreground/30 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold leading-snug">
                              {task.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                            <div className="flex items-center justify-between mt-2.5">
                              <div className="flex -space-x-1.5">
                                {task.assignees.slice(0, 3).map((uid) => {
                                  const user = getUserById(uid);
                                  const role = user
                                    ? getRoleById(user.roleId)
                                    : undefined;
                                  return (
                                    <Avatar
                                      key={uid}
                                      className="h-5 w-5 border-2 border-card"
                                    >
                                      <AvatarFallback
                                        className="text-[8px] font-bold"
                                        style={{
                                          backgroundColor: `${role?.color}25`,
                                          color: role?.color,
                                        }}
                                      >
                                        {user?.fullName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                  );
                                })}
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  daysLeft <= 3
                                    ? "border-destructive/50 text-destructive"
                                    : daysLeft <= 7
                                      ? "border-warning/50 text-warning"
                                      : "border-border text-muted-foreground"
                                }`}
                              >
                                <CalendarDays size={10} className="mr-1" />
                                {col.id === "done"
                                  ? "Completed"
                                  : `${daysLeft}d left`}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
