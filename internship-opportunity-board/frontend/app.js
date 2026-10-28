const API = "/api";
const state = { token: null, user: null, isAdmin: false, opportunities: [], savedIds: new Set(), authMode: "signin", savedOnly: false };
const $ = (id) => document.getElementById(id);

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function safeUrl(value) {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : "#"; } catch { return "#"; }
}
function showNotice(message, isError = false) {
  const node = $("notice"); node.textContent = message; node.classList.toggle("error", isError); node.classList.remove("hidden");
  window.setTimeout(() => node.classList.add("hidden"), 4500);
}
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong. Please try again.");
  return body;
}
function setUser(user, token) {
  state.user = user || null; state.token = token || null; state.isAdmin = Boolean(user?.role === "admin");
  $("authNav").classList.toggle("hidden", Boolean(user)); $("logoutBtn").classList.toggle("hidden", !user);
  $("savedNav").classList.toggle("hidden", !user); $("adminNav").classList.toggle("hidden", !state.isAdmin);
  $("ctaAuth").textContent = user ? "Explore opportunities ↗" : "Create a free account ↗";
}
async function loadOpportunities() {
  $("opportunityGrid").innerHTML = '<div class="loading-card">Loading opportunities…</div>';
  try {
    const data = await api("/internships");
    state.opportunities = data.internships || [];
    if (state.user) await loadSaved();
    renderFields(); renderOpportunities();
  } catch (error) {
    $("opportunityGrid").innerHTML = ""; $("resultCount").textContent = "Unable to load";
    showNotice(`${error.message} Check that the server and Supabase configuration are running.`, true);
  }
}
async function loadSaved() {
  if (!state.token) { state.savedIds = new Set(); return; }
  try { const data = await api("/saved"); state.savedIds = new Set(data.internshipIds); } catch { state.savedIds = new Set(); }
}
function renderFields() {
  const select = $("fieldFilter"), current = select.value;
  const fields = [...new Set(state.opportunities.map((item) => item.field).filter(Boolean))].sort();
  select.innerHTML = '<option value="">All fields</option>' + fields.map((field) => `<option value="${escapeHtml(field)}">${escapeHtml(field)}</option>`).join("");
  select.value = fields.includes(current) ? current : "";
}
function renderOpportunities() {
  const search = $("searchInput").value.trim().toLowerCase(), field = $("fieldFilter").value, mode = $("modeFilter").value, paid = $("paidFilter").value;
  const items = state.opportunities.filter((job) => {
    const haystack = [job.title, job.company, job.field, job.description, ...(job.skills || [])].join(" ").toLowerCase();
    const isPaid = Boolean(job.stipend && !/unpaid|not paid|volunteer/i.test(job.stipend));
    return (!search || haystack.includes(search)) && (!field || job.field === field) && (!mode || job.work_mode === mode) && (!paid || (paid === "paid" ? isPaid : !isPaid)) && (!state.savedOnly || state.savedIds.has(job.id));
  });
  $("resultCount").textContent = `${items.length} ${items.length === 1 ? "opportunity" : "opportunities"}`;
  $("opportunityGrid").innerHTML = items.map((job) => {
    const saved = state.savedIds.has(job.id);
    const skills = (job.skills || []).slice(0, 3).map((skill) => `<span class="tag">${escapeHtml(skill)}</span>`).join("");
    const stipend = job.stipend || "Not specified";
    return `<article class="job-card">
      <div class="job-card-top"><div class="company-mark">${escapeHtml((job.company || "?").slice(0, 2).toUpperCase())}</div><button class="save-button ${saved ? "saved" : ""}" data-save="${escapeHtml(job.id)}" aria-label="${saved ? "Remove saved opportunity" : "Save opportunity"}" title="${saved ? "Remove saved" : "Save opportunity"}">${saved ? "♥" : "♡"}</button></div>
      <h3 class="job-title">${escapeHtml(job.title)}</h3><div class="company-name">${escapeHtml(job.company)}</div>
      <div class="tag-row"><span class="tag field-tag">${escapeHtml(job.field)}</span><span class="tag">${escapeHtml(job.work_mode)}</span>${skills}</div>
      <p class="job-description">${escapeHtml(job.description)}</p>
      <div class="job-meta"><span>⌖ ${escapeHtml(job.location)}</span><span>◷ ${escapeHtml(job.duration || "Duration flexible")}</span><span>₹ ${escapeHtml(stipend)}</span></div>
      <div class="job-actions"><button class="button button-outline" data-details="${escapeHtml(job.id)}">View details</button><a class="button button-primary" href="${escapeHtml(safeUrl(job.apply_url))}" target="_blank" rel="noopener noreferrer">Apply ↗</a></div>
      ${state.isAdmin ? `<div class="job-actions"><button class="button button-outline" data-edit="${escapeHtml(job.id)}">Edit listing</button><button class="button button-outline" data-delete="${escapeHtml(job.id)}">Delete</button></div>` : ""}
    </article>`;
  }).join("");
  $("emptyState").classList.toggle("hidden", items.length !== 0);
}
function openAuth(mode = "signin") {
  state.authMode = mode; $("authModal").classList.remove("hidden"); $("authError").classList.add("hidden"); updateAuthMode();
  setTimeout(() => $("email").focus(), 50);
}
function updateAuthMode() {
  const signup = state.authMode === "signup";
  $("signinTab").classList.toggle("active", !signup); $("signupTab").classList.toggle("active", signup);
  $("nameField").classList.toggle("hidden", !signup); $("fullName").required = signup;
  $("authTitle").textContent = signup ? "Create your account" : "Welcome back";
  $("authSubtitle").textContent = signup ? "Create an account to save opportunities and keep your shortlist." : "Sign in to save opportunities and manage your shortlist.";
  $("authSubmit").textContent = signup ? "Create account" : "Sign in";
  $("password").autocomplete = signup ? "new-password" : "current-password";
}
function closeModal(name) { $(`${name}Modal`).classList.add("hidden"); }
function openDetails(id) {
  const job = state.opportunities.find((item) => item.id === id); if (!job) return;
  const skills = (job.skills || []).map((skill) => `<span class="tag">${escapeHtml(skill)}</span>`).join("");
  $("detailContent").innerHTML = `<div class="company-mark">${escapeHtml(job.company.slice(0,2).toUpperCase())}</div><h2 id="detailTitle" class="job-title">${escapeHtml(job.title)}</h2><p class="company-name">${escapeHtml(job.company)}</p><div class="tag-row"><span class="tag field-tag">${escapeHtml(job.field)}</span><span class="tag">${escapeHtml(job.work_mode)}</span>${skills}</div><div class="detail-grid"><div class="detail-item"><span>Location</span><strong>${escapeHtml(job.location)}</strong></div><div class="detail-item"><span>Stipend</span><strong>${escapeHtml(job.stipend || "Not specified")}</strong></div><div class="detail-item"><span>Duration</span><strong>${escapeHtml(job.duration || "Not specified")}</strong></div><div class="detail-item"><span>Deadline</span><strong>${escapeHtml(job.deadline || "Not specified")}</strong></div></div><h3>About this opportunity</h3><p class="detail-description">${escapeHtml(job.description)}</p><div class="job-actions"><button class="button button-outline" data-save="${escapeHtml(job.id)}">${state.savedIds.has(job.id) ? "♥ Saved" : "♡ Save opportunity"}</button><a class="button button-primary" href="${escapeHtml(safeUrl(job.apply_url))}" target="_blank" rel="noopener noreferrer">Open application ↗</a></div>`;
  $("detailModal").classList.remove("hidden");
}
async function toggleSaved(id) {
  if (!state.user) { openAuth("signin"); showNotice("Sign in to save opportunities."); return; }
  try {
    if (state.savedIds.has(id)) { await api(`/saved/${encodeURIComponent(id)}`, { method: "DELETE" }); state.savedIds.delete(id); showNotice("Removed from your saved opportunities."); }
    else { await api("/saved", { method: "POST", body: JSON.stringify({ internshipId: id }) }); state.savedIds.add(id); showNotice("Opportunity saved."); }
    renderOpportunities();
    if (!$("detailModal").classList.contains("hidden")) openDetails(id);
  } catch (error) { showNotice(error.message, true); }
}
function openAdmin(job = null) {
  if (!state.isAdmin) { showNotice("Administrator access is required.", true); return; }
  $("internshipForm").reset(); $("internshipId").value = job?.id || ""; $("adminError").classList.add("hidden");
  $("adminTitle").textContent = job ? "Edit opportunity" : "Add an opportunity";
  $("saveInternshipBtn").textContent = job ? "Save changes" : "Publish opportunity";
  if (job) {
    $("jobTitle").value = job.title; $("company").value = job.company; $("field").value = job.field; $("location").value = job.location;
    $("workMode").value = job.work_mode; $("stipend").value = job.stipend || ""; $("duration").value = job.duration || "";
    $("skills").value = (job.skills || []).join(", "); $("description").value = job.description; $("applyUrl").value = job.apply_url;
    $("deadline").value = job.deadline || "";
  }
  $("adminModal").classList.remove("hidden");
}
$("authNav").addEventListener("click", () => openAuth("signin"));
$("ctaAuth").addEventListener("click", () => state.user ? $("opportunities").scrollIntoView() : openAuth("signup"));
$("signinTab").addEventListener("click", () => { state.authMode = "signin"; updateAuthMode(); });
$("signupTab").addEventListener("click", () => { state.authMode = "signup"; updateAuthMode(); });
document.querySelectorAll("[data-close]").forEach((node) => node.addEventListener("click", () => closeModal(node.dataset.close)));
$("logoutBtn").addEventListener("click", () => { setUser(null, null); state.savedIds = new Set(); state.savedOnly = false; $("savedNav").textContent = "Saved"; showNotice("You have signed out."); renderOpportunities(); });
$("savedNav").addEventListener("click", () => { state.savedOnly = !state.savedOnly; $("savedNav").textContent = state.savedOnly ? "All opportunities" : "Saved"; $("opportunities").scrollIntoView(); renderOpportunities(); });
$("adminNav").addEventListener("click", () => openAdmin());
$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault(); $("authError").classList.add("hidden"); $("authSubmit").disabled = true;
  try {
    const signup = state.authMode === "signup";
    const data = await api(`/auth/${signup ? "register" : "login"}`, { method: "POST", body: JSON.stringify({ name: $("fullName").value.trim(), email: $("email").value.trim(), password: $("password").value }) });
    setUser(data.user, data.token); closeModal("auth"); $("authForm").reset(); await loadOpportunities(); showNotice(signup ? "Account created. Welcome to Internship Board!" : "You are signed in.");
  } catch (error) { $("authError").textContent = error.message; $("authError").classList.remove("hidden"); }
  finally { $("authSubmit").disabled = false; }
});
["searchInput", "fieldFilter", "modeFilter", "paidFilter"].forEach((id) => $(id).addEventListener(id === "searchInput" ? "input" : "change", renderOpportunities));
$("clearFilters").addEventListener("click", () => { $("searchInput").value = ""; $("fieldFilter").value = ""; $("modeFilter").value = ""; $("paidFilter").value = ""; state.savedOnly = false; $("savedNav").textContent = "Saved"; renderOpportunities(); });
$("opportunityGrid").addEventListener("click", async (event) => {
  const save = event.target.closest("[data-save]"); if (save) return toggleSaved(save.dataset.save);
  const details = event.target.closest("[data-details]"); if (details) return openDetails(details.dataset.details);
  const edit = event.target.closest("[data-edit]"); if (edit) return openAdmin(state.opportunities.find((job) => job.id === edit.dataset.edit));
  const del = event.target.closest("[data-delete]"); if (del && confirm("Delete this opportunity? This cannot be undone.")) {
    try { await api(`/internships/${encodeURIComponent(del.dataset.delete)}`, { method: "DELETE" }); showNotice("Opportunity deleted."); await loadOpportunities(); } catch (error) { showNotice(error.message, true); }
  }
});
$("detailContent").addEventListener("click", (event) => { const save = event.target.closest("[data-save]"); if (save) toggleSaved(save.dataset.save); });
$("internshipForm").addEventListener("submit", async (event) => {
  event.preventDefault(); $("adminError").classList.add("hidden"); $("saveInternshipBtn").disabled = true;
  const id = $("internshipId").value;
  const payload = { title: $("jobTitle").value.trim(), company: $("company").value.trim(), field: $("field").value.trim(), location: $("location").value.trim(), workMode: $("workMode").value, stipend: $("stipend").value.trim(), duration: $("duration").value.trim(), skills: $("skills").value.split(",").map((x) => x.trim()).filter(Boolean), description: $("description").value.trim(), applyUrl: $("applyUrl").value.trim(), deadline: $("deadline").value || null };
  try {
    await api(id ? `/internships/${encodeURIComponent(id)}` : "/internships", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
    closeModal("admin"); showNotice(id ? "Opportunity updated." : "Opportunity published."); await loadOpportunities();
  } catch (error) { $("adminError").textContent = error.message; $("adminError").classList.remove("hidden"); }
  finally { $("saveInternshipBtn").disabled = false; }
});
$("year").textContent = new Date().getFullYear();
(async function init() {
  try {
    const health = await api("/health");
    if (!health.ok) throw new Error("Server health check failed.");
    await loadOpportunities();
  } catch (error) { showNotice("Cannot connect to the application server. Start it with npm run dev from the backend folder.", true); $("opportunityGrid").innerHTML = ""; }
})();
