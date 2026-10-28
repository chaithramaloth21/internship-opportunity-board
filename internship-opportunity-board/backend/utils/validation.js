const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function text(value, name, { min = 1, max = 200, optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === "")) return null;
  if (typeof value !== "string") throw new Error(`${name} must be text.`);
  const result = value.trim();
  if (result.length < min || result.length > max) throw new Error(`${name} must be between ${min} and ${max} characters.`);
  return result;
}
function email(value) {
  const result = text(value, "Email", { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(result)) throw new Error("Enter a valid email address.");
  return result;
}
function password(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) throw new Error("Password must be between 8 and 128 characters.");
  return value;
}
function uuid(value, name = "ID") {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error(`${name} is invalid.`);
  return value;
}
function safeHttpUrl(value, name = "URL") {
  const result = text(value, name, { max: 1000 });
  let parsed;
  try { parsed = new URL(result); } catch { throw new Error(`${name} must be a valid URL.`); }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`${name} must start with http:// or https://.`);
  return parsed.href;
}
module.exports = { text, email, password, uuid, safeHttpUrl };
