require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const supabase = require("./supabase");
const authRoutes = require("./routes/auth");
const internshipRoutes = require("./routes/internships");
const savedRoutes = require("./routes/saved");

const app = express();
const port = Number(process.env.PORT) || 3000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn("WARNING: Set JWT_SECRET to a random value at least 32 characters long in backend/.env.");
}
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"], imgSrc: ["'self'", "data:"], connectSrc: ["'self'"], objectSrc: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], frameAncestors: ["'none'"] } } }));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || `http://localhost:${port}`, methods: ["GET", "POST", "PUT", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "30kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/saved", savedRoutes);
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "internship-opportunity-board" }));
app.use(express.static(path.join(__dirname, "..", "frontend"), { extensions: ["html"] }));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API endpoint not found." });
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"), (error) => error && next(error));
});
app.use((err, _req, res, _next) => {
  console.error("Request failed:", err.message || "Unknown error");
  const status = Number(err.status) >= 400 && Number(err.status) < 600 ? Number(err.status) : 500;
  res.status(status).json({ error: status === 500 ? "A server error occurred. Check server logs and database configuration." : err.message });
});

async function ensureAdmin() {
  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminEmail || !adminPassword) {
    console.warn("Admin account not seeded: set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.");
    return;
  }
  if (adminPassword.length < 12) throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  const { data: existing, error: lookupError } = await supabase.from("app_users").select("id,role").eq("email", adminEmail).maybeSingle();
  if (lookupError) throw lookupError;
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  if (existing) {
    if (existing.role !== "admin") {
      const { error } = await supabase.from("app_users").update({ role: "admin", password_hash: passwordHash }).eq("id", existing.id);
      if (error) throw error;
    } else {
      // Keep the configured administrator password synchronized with local environment settings.
      const { error } = await supabase.from("app_users").update({ password_hash: passwordHash }).eq("id", existing.id);
      if (error) throw error;
    }
  } else {
    const { error } = await supabase.from("app_users").insert({ name: "Board Administrator", email: adminEmail, password_hash: passwordHash, role: "admin" });
    if (error) throw error;
  }
  console.log(`Administrator account is ready for ${adminEmail}.`);
}
async function start() {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_URL.startsWith("https://") && !process.env.SUPABASE_URL.includes("YOUR_PROJECT_REF")) {
      await ensureAdmin();
    }
  } catch (error) {
    console.error("Could not initialize the administrator. Verify database/schema.sql and backend/.env:", error.message);
  }
  app.listen(port, () => console.log(`Internship Opportunity Board is running at http://localhost:${port}`));
}
if (require.main === module) start();
module.exports = { app, ensureAdmin };
