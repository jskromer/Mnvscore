function isUrlAllowed(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }

  // Only allow https
  if (parsed.protocol !== "https:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and loopback
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]") {
    return false;
  }

  // Block cloud metadata endpoints
  if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") {
    return false;
  }

  // Block private/reserved IP ranges
  const parts = hostname.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts.map(Number);
    if (a === 10) return false;              // 10.x.x.x
    if (a === 172 && b >= 16 && b <= 31) return false; // 172.16-31.x.x
    if (a === 192 && b === 168) return false; // 192.168.x.x
    if (a === 0) return false;                // 0.x.x.x
    if (a === 169 && b === 254) return false; // 169.254.x.x (link-local)
  }

  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!isUrlAllowed(url)) {
    return res.status(400).json({ error: "Invalid URL. Only public HTTPS URLs are allowed." });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MNVScorecard/1.0)",
        "Accept": "text/html,application/xhtml+xml,text/plain,application/pdf",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(400).json({ error: "Could not fetch the URL. Check the address and try again." });
    }

    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();

    // Strip HTML tags, scripts, styles to get plain text
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // Truncate to ~8000 chars to stay within API limits
    if (text.length > 8000) {
      text = text.slice(0, 8000) + "...";
    }

    return res.status(200).json({ text, contentType });
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch the URL." });
  }
}
