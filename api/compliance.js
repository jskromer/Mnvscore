import { buildSystemPrompt } from "./rubrics/prompt-builder.js";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4000;
const MAX_INPUT_LENGTH = 15000;

let cachedPrompt = null;

function getSystemPrompt() {
  if (!cachedPrompt) {
    cachedPrompt = buildSystemPrompt();
  }
  return cachedPrompt;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { content } = req.body;
  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  if (content.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: "Input too long. Please shorten your text." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: getSystemPrompt(),
        messages: [{ role: "user", content: content.trim() }],
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: "API request failed" });
  }
}
