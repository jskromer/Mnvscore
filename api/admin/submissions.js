export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return res.status(500).json({ error: "ADMIN_KEY not configured" });
  }

  // Accept key via query param or Authorization header
  const provided =
    req.query.key ||
    req.headers.authorization?.replace("Bearer ", "");

  if (provided !== adminKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { kv } = await import("@vercel/kv");
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const ids = await kv.lrange("submissions:index", 0, limit - 1);

    if (!ids || ids.length === 0) {
      return res.status(200).json({ submissions: [], count: 0 });
    }

    // Fetch all submission records in parallel
    const submissions = await Promise.all(
      ids.map(async (id) => {
        const record = await kv.hgetall(`submission:${id}`);
        return record ? { id, ...record } : { id, error: "not_found" };
      })
    );

    return res.status(200).json({
      submissions,
      count: submissions.length,
      total_indexed: await kv.llen("submissions:index"),
    });
  } catch (err) {
    console.error("Admin submissions error:", err);
    return res.status(500).json({ error: "Failed to fetch submissions" });
  }
}
