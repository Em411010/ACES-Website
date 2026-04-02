const mongoose = require("mongoose");
const Role = require("../src/models/Role");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://emmanueljr11010_db_user:TzKrRJeSQs7nPaF9@cluster0.0n24qnt.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(MONGO_URI);

  const res = await Role.updateMany(
    { name: { $in: ["Chairman", "Internal Vice Chairman", "External Vice Chairman", "Event Coordinator"] } },
    { $addToSet: { permissions: "MANAGE_ACTIVITIES" } }
  );
  console.log("Updated", res.modifiedCount, "roles with MANAGE_ACTIVITIES");

  const res2 = await Role.updateMany(
    { name: { $in: ["Chairman", "Internal Vice Chairman", "External Vice Chairman", "Event Coordinator"] } },
    { $addToSet: { permissions: "SCAN_ATTENDANCE" } }
  );
  console.log("Updated", res2.modifiedCount, "roles with SCAN_ATTENDANCE");

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => { console.error(e); process.exit(1); });
