// In-memory sliding window rate limiter for Vercel serverless functions.
// Each function instance maintains its own Map — this is "best effort" rate
// limiting that works well for single-instance burst protection. For strict
// distributed limiting you'd need Redis, but this covers the main abuse vector.

const windows = new Map();

const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup(windowMs) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, timestamps] of windows) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, valid);
    }
  }
}

/**
 * Check rate limit for a given request.
 * @param {object} req - Vercel request object
 * @param {object} res - Vercel response object
 * @param {number} limit - Max requests per window
 * @param {number} windowMs - Window size in milliseconds (default 60s)
 * @returns {boolean} true if rate limited (response already sent), false if allowed
 */
export function rateLimit(req, res, limit, windowMs = 60_000) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const now = Date.now();
  cleanup(windowMs);

  const timestamps = windows.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000);
    res.setHeader("Retry-After", retryAfter);
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return true;
  }

  recent.push(now);
  windows.set(ip, recent);
  return false;
}
