const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../supabase");
const { text, email, password } = require("../utils/validation");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

function makeToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "8h", issuer: "internship-opportunity-board" });
}
router.post("/register", async (req, res, next) => {
  try {
    const name = text(req.body.name, "Name", { min: 2, max: 80 });
    const userEmail = email(req.body.email);
    const userPassword = password(req.body.password);
    if (userEmail === String(process.env.ADMIN_EMAIL || "").toLowerCase()) return res.status(409).json({ error: "This email is reserved for the administrator." });
    const { data: existing, error: lookupError } = await supabase.from("app_users").select("id").eq("email", userEmail).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(userPassword, 12);
    const { data: user, error } = await supabase.from("app_users").insert({ name, email: userEmail, password_hash: passwordHash, role: "student" }).select("id,email,name,role").single();
    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "An account with this email already exists." });
      throw error;
    }
    return res.status(201).json({ token: makeToken(user), user });
  } catch (error) { if (error.message && !error.code) return res.status(400).json({ error: error.message }); next(error); }
});
router.post("/login", async (req, res, next) => {
  try {
    const userEmail = email(req.body.email), userPassword = password(req.body.password);
    const { data: user, error } = await supabase.from("app_users").select("id,email,name,role,password_hash").eq("email", userEmail).maybeSingle();
    if (error) throw error;
    if (!user || !(await bcrypt.compare(userPassword, user.password_hash))) return res.status(401).json({ error: "Email or password is incorrect." });
    const publicUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    return res.json({ token: makeToken(publicUser), user: publicUser });
  } catch (error) { if (error.message && !error.code) return res.status(400).json({ error: error.message }); next(error); }
});
router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
module.exports = router;
