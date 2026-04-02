require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./config/db");
const seedAll = require("./utils/seedAll");

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)
  .concat(["http://localhost:5174", "http://localhost:5175", "http://localhost:5176"]);

// Security
app.use(
  helmet({
    xFrameOptions: false,
    contentSecurityPolicy: {
      directives: {
        frameAncestors: ["'self'", ...allowedOrigins],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 200 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/users", require("./routes/users"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/events", require("./routes/events"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/activities", require("./routes/activities"));
app.use("/api/audit-logs", require("./routes/auditLogs"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/search", require("./routes/search"));

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../public");
  app.use(express.static(frontendPath));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await seedAll();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
