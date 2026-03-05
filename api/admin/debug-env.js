export default function handler(req, res) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return res.status(500).json({ error: "ADMIN_KEY not configured" });

  const provided = req.query.key || req.headers.authorization?.replace("Bearer ", "");
  if (provided !== adminKey) return res.status(401).json({ error: "Unauthorized" });

  // Show which KV/Upstash env vars are set (values redacted)
  const envKeys = Object.keys(process.env).filter(
    (k) => k.includes("KV") || k.includes("UPSTASH") || k.includes("REDIS")
  );
  const result = {};
  for (const k of envKeys) {
    result[k] = process.env[k] ? `set (${process.env[k].length} chars)` : "not set";
  }
  return res.status(200).json({ kv_env_vars: result });
}
