const SYSTEM_PROMPT = `You are an expert in Measurement & Verification (M&V) methodology for energy efficiency and demand-side management programs.

When given an M&V plan, methodology description, or vendor capability statement, you will analyze it across 8 dimensions:

1. measurement_method: What measurement approach is used (utility bill analysis, submetering, simulation, etc.)
2. boundary_scope: What is the measurement boundary (whole facility, system-level, end-use, component)
3. duration_cadence: How long and how frequently measurements occur (snapshot, short-term <30 days, long-term, continuous)
4. use_case_fit: What this M&V approach is best suited for (demand response, EE program verification, performance contract, carbon accounting, etc.)
5. savings_isolation: Ability to attribute savings to a specific measure vs. confounded by other factors
6. interactive_effects: Whether the method captures interactive effects like HVAC-lighting interactions
7. baseline_robustness: Quality and approach of baseline construction (normalized, TMY-adjusted, rolling, static snapshot)
8. uncertainty_quantification: Whether uncertainty or error is quantified (quantified with CI, acknowledged, not addressed)

For each dimension return:
- label: short 2-4 word label for what was found
- detail: 1-2 sentence explanation of what the plan says or implies
- flag: one of "sufficient", "limited", or "not_addressed"
- inference: one key implication or limitation this creates (what can or can't be done as a result)

Also return:
- subject: name/title of the M&V approach being evaluated
- summary: 2-3 sentence plain-language summary of what this M&V is and what it's designed to do
- use_case_match: the single best-fit use case label

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "subject": "...",
  "summary": "...",
  "use_case_match": "...",
  "dimensions": {
    "measurement_method": { "label": "...", "detail": "...", "flag": "...", "inference": "..." },
    "boundary_scope": { "label": "...", "detail": "...", "flag": "...", "inference": "..." },
    "duration_cadence": { "label": "...", "detail": "...", "flag": "...", "inference": "..." },
    "use_case_fit": { "label": "...", "detail": "...", "flag": "...", "inference": "..." },
    "savings_isolation": { "label": "...", "detail": "...", "flag": "...", "inference": "..." },
    "interactive_effects": { "label": "...", "detail": "...", "flag": "...", "inference": "..." },
    "baseline_robustness": { "label": "...", "detail": "...", "flag": "...", "inference": "..." },
    "uncertainty_quantification": { "label": "...", "detail": "...", "flag": "...", "inference": "..." }
  }
}`;

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1000;
const MAX_INPUT_LENGTH = 15000;

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
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: content.trim() }],
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: "API request failed" });
  }
}
