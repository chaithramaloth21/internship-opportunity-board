const express = require("express");
const supabase = require("../supabase");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { text, uuid, safeHttpUrl } = require("../utils/validation");
const router = express.Router();

function validatePayload(body) {
  const title = text(body.title, "Title", { max: 140 });
  const company = text(body.company, "Company", { max: 120 });
  const field = text(body.field, "Field", { max: 80 });
  const location = text(body.location, "Location", { max: 120 });
  const workMode = text(body.workMode, "Work mode", { max: 20 });
  if (!["Remote", "Hybrid", "On-site"].includes(workMode)) throw new Error("Choose Remote, Hybrid, or On-site for work mode.");
  const description = text(body.description, "Description", { max: 4000 });
  const applyUrl = safeHttpUrl(body.applyUrl, "Application URL");
  const skills = body.skills === undefined ? [] : body.skills;
  if (!Array.isArray(skills) || skills.length > 20 || skills.some((skill) => typeof skill !== "string" || skill.trim().length > 40)) throw new Error("Skills must be a list of up to 20 short text values.");
  let deadline = null;
  if (body.deadline) {
    if (typeof body.deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.deadline) || Number.isNaN(Date.parse(`${body.deadline}T00:00:00Z`))) throw new Error("Deadline must be a valid date.");
    deadline = body.deadline;
  }
  return { title, company, field, location, work_mode: workMode, stipend: text(body.stipend || "", "Stipend", { min: 0, max: 100, optional: true }), duration: text(body.duration || "", "Duration", { min: 0, max: 80, optional: true }), skills: skills.map((skill) => skill.trim()).filter(Boolean), description, apply_url: applyUrl, deadline };
}
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("internships").select("id,title,company,field,location,work_mode,stipend,duration,skills,description,apply_url,deadline,created_at,updated_at").order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ internships: data });
  } catch (error) { next(error); }
});
router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = validatePayload(req.body);
    const { data, error } = await supabase.from("internships").insert({ ...payload, created_by: req.user.id }).select().single();
    if (error) throw error;
    res.status(201).json({ internship: data });
  } catch (error) { if (error.message && !error.code) return res.status(400).json({ error: error.message }); next(error); }
});
router.put("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = uuid(req.params.id, "Internship ID"), payload = validatePayload(req.body);
    const { data, error } = await supabase.from("internships").update(payload).eq("id", id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Opportunity not found." });
    res.json({ internship: data });
  } catch (error) { if (error.message && !error.code) return res.status(400).json({ error: error.message }); next(error); }
});
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = uuid(req.params.id, "Internship ID");
    const { data, error } = await supabase.from("internships").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Opportunity not found." });
    res.json({ message: "Opportunity deleted." });
  } catch (error) { if (error.message && !error.code) return res.status(400).json({ error: error.message }); next(error); }
});
module.exports = router;
