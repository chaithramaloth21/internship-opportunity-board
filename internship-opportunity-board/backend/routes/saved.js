const express = require("express");
const supabase = require("../supabase");
const { requireAuth } = require("../middleware/auth");
const { uuid } = require("../utils/validation");
const router = express.Router();
router.use(requireAuth);
router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("saved_internships").select("internship_id").eq("user_id", req.user.id);
    if (error) throw error;
    res.json({ internshipIds: data.map((item) => item.internship_id) });
  } catch (error) { next(error); }
});
router.post("/", async (req, res, next) => {
  try {
    const internshipId = uuid(req.body.internshipId, "Internship ID");
    const { error } = await supabase.from("saved_internships").insert({ user_id: req.user.id, internship_id: internshipId });
    if (error?.code === "23505") return res.json({ message: "Opportunity is already saved." });
    if (error?.code === "23503") return res.status(404).json({ error: "Opportunity not found." });
    if (error) throw error;
    res.status(201).json({ message: "Opportunity saved." });
  } catch (error) { if (error.message && !error.code) return res.status(400).json({ error: error.message }); next(error); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const internshipId = uuid(req.params.id, "Internship ID");
    const { error } = await supabase.from("saved_internships").delete().eq("user_id", req.user.id).eq("internship_id", internshipId);
    if (error) throw error;
    res.json({ message: "Opportunity removed from saved list." });
  } catch (error) { if (error.message && !error.code) return res.status(400).json({ error: error.message }); next(error); }
});
module.exports = router;
