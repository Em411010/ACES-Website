import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { eventsApi, tasksApi, usersApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import type { EventItem, Task, User, Role } from "@/types";

const columns = [
  { id: "todo" as const, label: "To Do", color: "bg-muted-foreground" },
  { id: "in-progress" as const, label: "In Progress", color: "bg-cyan" },
  { id: "review" as const, label: "Review", color: "bg-warning" },
  { id: "done" as const, label: "Done", color: "bg-success" },
];

const DEFAULT_EVENT = "General";

function getTaskEvent(task: Task) {
  const value = task.eventCluster?.trim();
  return value && value.length > 0 ? value : DEFAULT_EVENT;
}

function toDateTimeLocalInput(value: string | Date) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function formatExactDeadline(value: string | Date) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Invalid deadline";
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRemaining(value: string | Date) {
  const deadlineMs = new Date(value).getTime();
  if (Number.isNaN(deadlineMs)) return "No deadline";

  const diffMs = deadlineMs - Date.now();
  const absMs = Math.abs(diffMs);
  const totalMinutes = Math.floor(absMs / (1000 * 60));
  const totalHours = Math.floor(absMs / (1000 * 60 * 60));
  const totalDays = Math.floor(absMs / (1000 * 60 * 60 * 24));

  let unitText = "";
  if (totalDays >= 1) {
    unitText = `${totalDays}d`;
  } else if (totalHours >= 1) {
    unitText = `${totalHours}h`;
  } else {
    unitText = `${Math.max(1, totalMinutes)}m`;
  }

  return diffMs >= 0 ? `${unitText} left` : `${unitText} overdue`;
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [showCreateEventCard, setShowCreateEventCard] = useState(false);
  const [showEditEventCard, setShowEditEventCard] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [savingEventEdit, setSavingEventEdit] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskEvent, setEditingTaskEvent] = useState("General");
  const [newEventName, setNewEventName] = useState("");
  const [editEventName, setEditEventName] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    assignees: [] as string[],
  });
  const [editTask, setEditTask] = useState({
    title: "",
    description: "",
    deadline: "",
    assignees: [] as string[],
    status: "todo" as "todo" | "in-progress" | "review" | "done",
  });

  const isChairman = user?.roleId?.name === "Chairman";
  const canCreateTask = !!user?.roleId?.permissions?.includes("CREATE_TASK");

  const taskEvents = Array.from(new Set(tasks.map((t) => getTaskEvent(t))));
  const persistedEvents = events.map((e) => e.name);
  const allEvents = [
    DEFAULT_EVENT,
    ...Array.from(
      new Set([
        ...taskEvents.filter((e) => e !== DEFAULT_EVENT),
        ...persistedEvents.filter((e) => e !== DEFAULT_EVENT),
      ])
    ),
  ];
  const selectedEventRecord = events.find((e) => e.name === selectedEvent) || null;
  const realEvents = allEvents.filter((e) => e !== DEFAULT_EVENT);
  const isDefaultEventSelected = selectedEvent === DEFAULT_EVENT;
  const scopedTasks = selectedEvent
    ? tasks.filter((t) => getTaskEvent(t) === selectedEvent)
    : [];

  useEffect(() => {
    Promise.all([tasksApi.getAll(), usersApi.getAll(), eventsApi.getAll()])
      .then(([taskData, userData, eventData]) => {
        setTasks(taskData);
        setEvents(eventData);

        const sorted = [...(userData as User[])].sort((a, b) => {
          const roleA = typeof a.roleId === "object" ? (a.roleId as Role) : null;
          const roleB = typeof b.roleId === "object" ? (b.roleId as Role) : null;
          const posA = roleA?.position ?? 999;
          const posB = roleB?.position ?? 999;
          if (posA !== posB) return posA - posB;
          return a.fullName.localeCompare(b.fullName);
        });
        setMembers(sorted);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEvent && allEvents.length > 0) {
      setSelectedEvent(allEvents[0]);
      return;
    }

    if (selectedEvent && !allEvents.includes(selectedEvent)) {
      setSelectedEvent(allEvents[0] || "");
    }
  }, [selectedEvent, allEvents]);

  async function handleCreateEvent() {
    const eventName = newEventName.trim();
    if (!eventName) return;

    if (eventName.toLowerCase() === DEFAULT_EVENT.toLowerCase()) {
      window.alert("General already exists as the default bucket.");
      return;
    }

    if (allEvents.some((e) => e.toLowerCase() === eventName.toLowerCase())) {
      window.alert("Event already exists.");
      return;
    }

    try {
      setCreatingEvent(true);
      await eventsApi.create(eventName);
      const updatedEvents = await eventsApi.getAll();
      setEvents(updatedEvents);
      setSelectedEvent(eventName);
      setNewEventName("");
      setShowCreateEventCard(false);
    } catch {
      window.alert("Failed to create event.");
    } finally {
      setCreatingEvent(false);
    }
  }

  function getAssigneeIds(task: Task) {
    return task.assignees
      .map((a) => (typeof a === "object" ? (a as User)._id : a))
      .filter(Boolean) as string[];
  }

  function openEditEvent() {
    if (!selectedEvent) return;
    setEditEventName(selectedEvent);
    setShowEditEventCard(true);
  }

  async function handleSaveEventEdit() {
    const nextEvent = editEventName.trim();
    if (!selectedEvent || !nextEvent) return;
    if (selectedEvent === DEFAULT_EVENT) {
      window.alert("General is the default bucket and cannot be renamed.");
      return;
    }

    if (
      allEvents.some(
        (e) => e.toLowerCase() === nextEvent.toLowerCase() && e !== selectedEvent
      )
    ) {
      window.alert("An event with that name already exists.");
      return;
    }

    if (nextEvent === selectedEvent) {
      setShowEditEventCard(false);
      return;
    }

    const affectedTasks = tasks.filter((t) => getTaskEvent(t) === selectedEvent);

    try {
      setSavingEventEdit(true);

      await Promise.all(
        affectedTasks.map((task) =>
          tasksApi.update(task._id, {
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            assignees: getAssigneeIds(task),
            status: task.status,
            eventCluster: nextEvent,
          })
        )
      );

      if (selectedEventRecord && !selectedEventRecord.isDefault) {
        await eventsApi.update(selectedEventRecord._id, nextEvent);
      }

      const [updatedTasks, updatedEvents] = await Promise.all([
        tasksApi.getAll(),
        eventsApi.getAll(),
      ]);
      setTasks(updatedTasks);
      setEvents(updatedEvents);
      setSelectedEvent(nextEvent);
      setShowEditEventCard(false);
    } catch {
      window.alert("Failed to rename event.");
    } finally {
      setSavingEventEdit(false);
    }
  }

  async function handleDeleteEvent() {
    if (!selectedEvent) return;
    if (selectedEvent === DEFAULT_EVENT) {
      window.alert("General is the default bucket and cannot be deleted.");
      return;
    }
    const ok = window.confirm(
      `Delete event \"${selectedEvent}\"? All tasks under this event will be deleted.`
    );
    if (!ok) return;

    const affectedTasks = tasks.filter((t) => getTaskEvent(t) === selectedEvent);

    try {
      setDeletingEvent(true);

      await Promise.all(affectedTasks.map((task) => tasksApi.remove(task._id)));

      if (selectedEventRecord && !selectedEventRecord.isDefault) {
        await eventsApi.remove(selectedEventRecord._id);
      }

      const [updatedTasks, updatedEvents] = await Promise.all([
        tasksApi.getAll(),
        eventsApi.getAll(),
      ]);
      setTasks(updatedTasks);
      setEvents(updatedEvents);
      setSelectedEvent(DEFAULT_EVENT);
    } catch {
      window.alert("Failed to delete event.");
    } finally {
      setDeletingEvent(false);
    }
  }

  async function handleCreateTask() {
    if (!canCreateTask) return;
    if (!selectedEvent) return;

    const title = newTask.title.trim();
    const description = newTask.description.trim();
    const deadline = newTask.deadline;

    if (!title || !description || !deadline || newTask.assignees.length === 0) {
      window.alert("Please fill task name, description, deadline, and at least one assignee.");
      return;
    }

    try {
      setCreating(true);
      await tasksApi.create({
        title,
        description,
        deadline,
        assignees: newTask.assignees,
        eventCluster: selectedEvent,
      });

      const updated = await tasksApi.getAll();
      setTasks(updated);
      setNewTask({ title: "", description: "", deadline: "", assignees: [] });
      setShowCreateCard(false);
    } catch {
      window.alert("Failed to create task. Check your permission or input.");
    } finally {
      setCreating(false);
    }
  }

  function toggleAssignee(userId: string) {
    setNewTask((prev) => {
      const exists = prev.assignees.includes(userId);
      return {
        ...prev,
        assignees: exists
          ? prev.assignees.filter((id) => id !== userId)
          : [...prev.assignees, userId],
      };
    });
  }

  function toggleEditAssignee(userId: string) {
    setEditTask((prev) => {
      const exists = prev.assignees.includes(userId);
      return {
        ...prev,
        assignees: exists
          ? prev.assignees.filter((id) => id !== userId)
          : [...prev.assignees, userId],
      };
    });
  }

  function openEditTask(task: Task) {
    const assignees = task.assignees
      .map((a) => (typeof a === "object" ? (a as User)._id : a))
      .filter(Boolean) as string[];

    setEditingTaskId(task._id);
    setEditingTaskEvent(getTaskEvent(task));
    setEditTask({
      title: task.title,
      description: task.description,
      deadline: toDateTimeLocalInput(task.deadline),
      assignees,
      status: task.status,
    });
    setShowEditCard(true);
  }

  async function handleSaveEditTask() {
    if (!editingTaskId) return;

    const title = editTask.title.trim();
    const description = editTask.description.trim();
    const deadline = editTask.deadline;

    if (!title || !description || !deadline || editTask.assignees.length === 0) {
      window.alert("Please fill task name, description, deadline, and at least one assignee.");
      return;
    }

    try {
      setSavingEdit(true);
      await tasksApi.update(editingTaskId, {
        title,
        description,
        deadline,
        assignees: editTask.assignees,
        status: editTask.status,
        eventCluster: editingTaskEvent,
      });

      const updated = await tasksApi.getAll();
      setTasks(updated);
      setShowEditCard(false);
      setEditingTaskId(null);
    } catch {
      window.alert("Failed to update task. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!canCreateTask) return;
    const ok = window.confirm("Delete this task?");
    if (!ok) return;

    try {
      setDeletingTaskId(taskId);
      await tasksApi.remove(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch {
      window.alert("Failed to delete task.");
    } finally {
      setDeletingTaskId(null);
    }
  }

  function handleDragStart(taskId: string) {
    if (!isChairman) return;
    setDraggedTaskId(taskId);
  }

  async function handleDrop(nextStatus: "todo" | "in-progress" | "review" | "done") {
    if (!isChairman || !draggedTaskId) return;

    const currentTask = tasks.find((t) => t._id === draggedTaskId);
    if (!currentTask || currentTask.status === nextStatus) {
      setDraggedTaskId(null);
      return;
    }

    const prevTasks = tasks;
    setUpdatingTaskId(draggedTaskId);
    setTasks((prev) =>
      prev.map((t) => (t._id === draggedTaskId ? { ...t, status: nextStatus } : t))
    );

    try {
      await tasksApi.updateStatus(draggedTaskId, nextStatus);
    } catch {
      setTasks(prevTasks);
      window.alert("Failed to move task. Please try again.");
    } finally {
      setUpdatingTaskId(null);
      setDraggedTaskId(null);
    }
  }

  const STAGE_ORDER: Array<"todo" | "in-progress" | "review" | "done"> = ["todo", "in-progress", "review", "done"];

  async function handleMoveTask(taskId: string, direction: "prev" | "next") {
    if (!isChairman) return;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;
    const curIdx = STAGE_ORDER.indexOf(task.status);
    const nextIdx = direction === "next" ? curIdx + 1 : curIdx - 1;
    if (nextIdx < 0 || nextIdx >= STAGE_ORDER.length) return;
    const nextStatus = STAGE_ORDER[nextIdx];

    const prevTasks = tasks;
    setUpdatingTaskId(taskId);
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: nextStatus } : t))
    );
    try {
      await tasksApi.updateStatus(taskId, nextStatus);
    } catch {
      setTasks(prevTasks);
      window.alert("Failed to move task.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const total = tasks.length;
  const eventTotal = scopedTasks.length;
  const eventDone = scopedTasks.filter((t) => t.status === "done").length;
  const progress = eventTotal ? Math.round((eventDone / eventTotal) * 100) : 0;

  return (
    <div className="relative space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm text-muted-foreground font-medium">
            Task Board
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              {total} total tasks across {realEvents.length} events + {DEFAULT_EVENT}
            </span>
          </div>
        </div>
        {canCreateTask && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateEventCard(true)}
              className="px-3 sm:px-4 py-2 border border-input rounded-lg text-sm font-semibold hover:bg-accent/40 transition-colors"
            >
              + New Event
            </button>
            <button
              onClick={() => setShowCreateCard(true)}
              disabled={!selectedEvent}
              className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + New Task
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {allEvents.map((eventName) => {
          const eventTaskCount = tasks.filter((t) => getTaskEvent(t) === eventName).length;
          const isActive = selectedEvent === eventName;
          return (
            <button
              key={eventName}
              onClick={() => setSelectedEvent(eventName)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input text-muted-foreground hover:bg-accent/40"
              }`}
            >
              {eventName === DEFAULT_EVENT ? `${eventName} (Default)` : eventName} ({eventTaskCount})
            </button>
          );
        })}
      </div>

      {selectedEvent && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{selectedEvent}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {eventDone} of {eventTotal} tasks done
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Progress value={progress} className="h-2 w-32 sm:w-48" />
                <span className="text-sm font-semibold">{progress}%</span>
                {canCreateTask && !isDefaultEventSelected && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openEditEvent}
                      className="px-3 py-1.5 rounded-md border border-input text-xs font-semibold hover:bg-accent/40"
                    >
                      Edit Event
                    </button>
                    <button
                      onClick={() => {
                        void handleDeleteEvent();
                      }}
                      disabled={deletingEvent}
                      className="px-3 py-1.5 rounded-md border border-destructive/40 text-destructive text-xs font-semibold hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {deletingEvent ? "Deleting..." : "Delete Event"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showEditEventCard && canCreateTask && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Close edit event dialog"
            onClick={() => {
              setShowEditEventCard(false);
              setEditEventName("");
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          <Card className="relative z-50 w-full max-w-lg border-cyan/30 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Edit Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Event Name</label>
                <input
                  type="text"
                  aria-label="Edit event name"
                  value={editEventName}
                  onChange={(e) => setEditEventName(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowEditEventCard(false);
                    setEditEventName("");
                  }}
                  className="px-3 py-2 rounded-md border border-input text-sm hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEventEdit}
                  disabled={savingEventEdit}
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {savingEventEdit ? "Saving..." : "Save Event"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCreateEventCard && canCreateTask && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Close create event dialog"
            onClick={() => {
              setShowCreateEventCard(false);
              setNewEventName("");
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          <Card className="relative z-50 w-full max-w-lg border-cyan/30 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Create Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Event Name</label>
                <input
                  type="text"
                  aria-label="Event name"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g. Robotics Bootcamp 2026"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCreateEventCard(false);
                    setNewEventName("");
                  }}
                  className="px-3 py-2 rounded-md border border-input text-sm hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={creatingEvent}
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {creatingEvent ? "Creating..." : "Create Event"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showCreateCard && canCreateTask && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Close create task dialog"
            onClick={() => {
              setShowCreateCard(false);
              setNewTask({ title: "", description: "", deadline: "", assignees: [] });
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          <Card className="relative z-50 w-full max-w-2xl border-cyan/30 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Create Task - {selectedEvent || "No Event Selected"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Task Name</label>
                  <input
                    type="text"
                    aria-label="Task name"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Setup registration booth"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Deadline</label>
                  <input
                    type="datetime-local"
                    aria-label="Task deadline"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea
                  aria-label="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe the task details"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Assign To</label>
                <div className="max-h-40 overflow-y-auto rounded-md border border-input p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {members.map((m) => {
                    const selected = newTask.assignees.includes(m._id);
                    const roleObj = typeof m.roleId === "object" ? (m.roleId as Role) : null;
                    return (
                      <label key={m._id} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-accent/40 cursor-pointer">
                        <input
                          type="checkbox"
                          aria-label={`Assign task to ${m.fullName}`}
                          checked={selected}
                          onChange={() => toggleAssignee(m._id)}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium leading-tight">{m.fullName}</p>
                          <p className="truncate text-[11px] text-muted-foreground leading-tight">
                            {roleObj?.name || "Member"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCreateCard(false);
                    setNewTask({ title: "", description: "", deadline: "", assignees: [] });
                  }}
                  className="px-3 py-2 rounded-md border border-input text-sm hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={creating}
                  className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditCard && canCreateTask && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Close edit task dialog"
            onClick={() => {
              setShowEditCard(false);
              setEditingTaskId(null);
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          <Card className="relative z-50 w-full max-w-2xl border-cyan/30 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Edit Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Task Name</label>
                  <input
                    type="text"
                    aria-label="Edit task name"
                    value={editTask.title}
                    onChange={(e) => setEditTask((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Deadline</label>
                  <input
                    type="datetime-local"
                    aria-label="Edit task deadline"
                    value={editTask.deadline}
                    onChange={(e) => setEditTask((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea
                  aria-label="Edit task description"
                  value={editTask.description}
                  onChange={(e) => setEditTask((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <select
                    aria-label="Edit task status"
                    value={editTask.status}
                    onChange={(e) =>
                      setEditTask((prev) => ({
                        ...prev,
                        status: e.target.value as "todo" | "in-progress" | "review" | "done",
                      }))
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Assign To</label>
                  <div className="max-h-32 overflow-y-auto rounded-md border border-input p-2 grid grid-cols-1 gap-1.5">
                    {members.map((m) => {
                      const selected = editTask.assignees.includes(m._id);
                      const roleObj = typeof m.roleId === "object" ? (m.roleId as Role) : null;
                      return (
                        <label key={m._id} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-accent/40 cursor-pointer">
                          <input
                            type="checkbox"
                            aria-label={`Assign edited task to ${m.fullName}`}
                            checked={selected}
                            onChange={() => toggleEditAssignee(m._id)}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium leading-tight">{m.fullName}</p>
                            <p className="truncate text-[11px] text-muted-foreground leading-tight">
                              {roleObj?.name || "Member"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowEditCard(false);
                    setEditingTaskId(null);
                  }}
                  className="px-3 py-2 rounded-md border border-input text-sm hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditTask}
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

      {/* Kanban Board */}
      {!selectedEvent ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No event selected yet. Create an event to start adding tasks.
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = scopedTasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {colTasks.length}
                </Badge>
              </div>

              <div
                className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30 border border-dashed border-border"
                onDragOver={(e) => {
                  if (!isChairman) return;
                  e.preventDefault();
                }}
                onDrop={() => {
                  void handleDrop(col.id);
                }}
              >
                {colTasks.map((task) => {
                  const deadlineMs = new Date(task.deadline).getTime();
                  const daysLeft = Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24));
                  const exactDeadline = formatExactDeadline(task.deadline);
                  const remainingText = formatRemaining(task.deadline);
                  const assigneeUsers = task.assignees
                    .map((assignee) => {
                      if (typeof assignee === "object") return assignee as User;
                      return members.find((m) => m._id === assignee) || null;
                    })
                    .filter(Boolean) as User[];
                  return (
                    <Card
                      key={task._id}
                      draggable={isChairman}
                      onDragStart={() => handleDragStart(task._id)}
                      className={`hover:shadow-md transition-shadow duration-200 group ${
                        isChairman ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                      } ${updatingTaskId === task._id ? "opacity-60" : ""}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical
                            size={14}
                            className="text-muted-foreground/30 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="flex-1 min-w-0">
                            {canCreateTask && (
                              <div className="mb-2 flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditTask(task)}
                                  className="px-2 py-0.5 rounded border border-input text-[10px] hover:bg-accent/40"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    void handleDeleteTask(task._id);
                                  }}
                                  disabled={deletingTaskId === task._id}
                                  className="px-2 py-0.5 rounded border border-destructive/40 text-destructive text-[10px] hover:bg-destructive/10 disabled:opacity-50"
                                >
                                  {deletingTaskId === task._id ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            )}
                            <h4 className="text-sm font-semibold leading-snug">
                              {task.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                            <div className="mt-2 space-y-1">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                                Assigned To
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {assigneeUsers.length > 0 ? (
                                  assigneeUsers.slice(0, 3).map((u) => {
                                    const roleObj =
                                      typeof u.roleId === "object" ? (u.roleId as Role) : null;
                                    return (
                                      <Badge
                                        key={u._id}
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-5 border-border"
                                      >
                                        {u.fullName} {roleObj ? `(${roleObj.name})` : ""}
                                      </Badge>
                                    );
                                  })
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">Unassigned</span>
                                )}
                                {assigneeUsers.length > 3 && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                    +{assigneeUsers.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2.5">
                              <div className="flex -space-x-1.5">
                                {task.assignees.slice(0, 3).map((assignee, i) => {
                                  const u = typeof assignee === "object" ? (assignee as User) : null;
                                  const roleObj = u && typeof u.roleId === "object" ? (u.roleId as Role) : null;
                                  return (
                                    <Avatar key={i} className="h-5 w-5 border-2 border-card">
                                      <AvatarFallback
                                        className="text-[8px] font-bold"
                                        style={{
                                          backgroundColor: `${roleObj?.color}25`,
                                          color: roleObj?.color,
                                        }}
                                      >
                                        {u?.fullName?.[0] ?? "?"}
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
                                  : remainingText}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Due: {exactDeadline}
                            </p>
                            {/* Mobile stage-move buttons (Chairman only) */}
                            {isChairman && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 md:hidden">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMoveTask(task._id, "prev"); }}
                                  disabled={col.id === "todo" || updatingTaskId === task._id}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                >
                                  <ChevronLeft size={14} />
                                  {col.id !== "todo" && (
                                    <span>{columns[columns.findIndex((c) => c.id === col.id) - 1]?.label}</span>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMoveTask(task._id, "next"); }}
                                  disabled={col.id === "done" || updatingTaskId === task._id}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                >
                                  {col.id !== "done" && (
                                    <span>{columns[columns.findIndex((c) => c.id === col.id) + 1]?.label}</span>
                                  )}
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                            )}
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
      )}
    </div>
  );
}
