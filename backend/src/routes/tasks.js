const router = require("express").Router();
const Task = require("../models/Task");
const { authenticate, checkPerm } = require("../middleware/auth");

// Get all tasks
router.get("/", authenticate, async (_req, res) => {
  const tasks = await Task.find()
    .populate("assignees", "fullName avatar roleId")
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
  res.json(task);
});

// Delete task
router.delete("/:id", authenticate, checkPerm("CREATE_TASK"), async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json({ message: "Task deleted" });
});

module.exports = router;
