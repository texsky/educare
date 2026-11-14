/**
 * EduCare Solutions — Migration Runner (Placeholder)
 * =====================================================
 * This file is intentionally minimal. As the schema evolves,
 * add numbered migration functions here and run them in order.
 *
 * Usage:
 *   node src/scripts/migrate.js
 */

"use strict";

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// ─── Migration registry ───────────────────────────────────────────────────────
// Add migration functions in chronological order.
// Each migration must be idempotent (safe to run more than once).
const migrations = [
  // {
  //   version: "001",
  //   description: "Add index on Student.admissionNo",
  //   run: async () => {
  //     const db = mongoose.connection.db;
  //     await db.collection("students").createIndex({ admissionNo: 1 }, { unique: true });
  //   },
  // },
];

// ─── Runner ───────────────────────────────────────────────────────────────────
async function runMigrations() {
  const uri =
    process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/educare";

  console.log("🔄  Connecting to MongoDB for migrations…");
  await mongoose.connect(uri);
  console.log("✅  Connected.");

  if (migrations.length === 0) {
    console.log("ℹ️   No migrations to run.");
  }

  for (const migration of migrations) {
    try {
      console.log(`⏳  Running migration ${migration.version}: ${migration.description}`);
      await migration.run();
      console.log(`✅  Migration ${migration.version} complete.`);
    } catch (err) {
      console.error(`❌  Migration ${migration.version} failed:`, err.message);
      process.exit(1);
    }
  }

  console.log("🎉  All migrations complete.");
  await mongoose.disconnect();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌  Migration runner error:", err);
  process.exit(1);
});
