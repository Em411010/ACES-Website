const router = require("express").Router();
const Task = require("../models/Task");
const { authenticate, checkPerm } = require("../middleware/auth");
const { audit } = require("../utils/auditLogger");
const { notify } = require("../utils/notifier");

// Get all tasks
router.get("/", authenticate, async (_req, res) => {
  const tasks = await Task.find()
    .populate({ path: "assignees", select: "fullName avatar roleId", populate: { path: "roleId", select: "name color" } })
    .populate("createdBy", "fullName")
    .sort({ createdAt: -1 });
  res.json(tasks);
});

// Create task
router.post("/", authenticate, checkPerm("CREATE_TASK"), async (req, res) => {
  const { title, description, deadline, assignees, eventCluster } = req.body;

  const task = await Task.create({
    title,
    description,
    deadline,
    assignees: assignees || [],
    eventCluster: eventCluster || "",
    createdBy: req.user._id,
  });

  await audit(req, {
    action: "CREATE_TASK",
    module: "TASK",
    targetType: "Task",
    targetId: task._id,
    details: `Created task "${title}"`,
    metadata: { title, deadline },
  });

  // Notify assignees
  const assigneeIds = (assignees || []).filter((id) => String(id) !== String(req.user._id));
  if (assigneeIds.length > 0) {
    await notify({
      recipientId: assigneeIds,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: `${req.user.fullName} assigned you to "${title}"`,
      link: "/tasks",
      metadata: { taskId: String(task._id) },
    });
  }

  res.status(201).json(task);
});

// Update task status (anyone assigned can update)
router.patch("/:id/status", authenticate, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { status } = req.body;
  const validStatuses = ["todo", "in-progress", "review", "done"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  task.status = status;
  await task.save();

  await audit(req, {
    action: "UPDATE_TASK_STATUS",
    module: "TASK",
    targetType: "Task",
    targetId: task._id,
    details: `Changed task "${task.title}" status to ${status}`,
    metadata: { status },
  });

  // Notify other assignees about status change
  const otherAssignees = (task.assignees || []).map(String).filter((id) => id !== String(req.user._id));
  if (otherAssignees.length > 0) {
    await notify({
      recipientId: otherAssignees,
      type: "TASK_STATUS_CHANGED",
      title: "Task Status Updated",
      message: `${req.user.fullName} changed "${task.title}" to ${status}`,
      link: "/tasks",
      metadata: { taskId: String(task._id), status },
    });
  }

  res.json(task);
});

// Update task
router.put("/:id", authenticate, checkPerm("CREATE_TASK"), async (req, res) => {
  const { title, description, deadline, assignees, eventCluster, status } = req.body;
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { title, description, deadline, assignees, eventCluster, status },
    { new: true }
  );
  if (!task) return res.status(404).json({ error: "Task not found" });

  await audit(req, {
    action: "UPDATE_TASK",
    module: "TASK",
    targetType: "Task",
    targetId: task._id,
    details: `Updated task "${task.title}"`,
  });

  // Notify newly assigned users
  const assigneeIds = (assignees || []).filter((id) => String(id) !== String(req.user._id));
  if (assigneeIds.length > 0) {
    await notify({
      recipientId: assigneeIds,
      type: "TASK_ASSIGNED",
      title: "Task Updated",
      message: `${req.user.fullName} updated task "${task.title}" you're assigned to`,
      link: "/tasks",
      metadata: { taskId: String(task._id) },
    });
  }

  res.json(task);
});

// Delete task
router.delete("/:id", authenticate, checkPerm("CREATE_TASK"), async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  await audit(req, {
    action: "DELETE_TASK",
    module: "TASK",
    targetType: "Task",
    targetId: task._id,
    details: `Deleted task "${task.title}"`,
  });

  res.json({ message: "Task deleted" });
});

module.exports = router;
