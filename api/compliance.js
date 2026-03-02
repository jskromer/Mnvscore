import { buildSystemPrompt } from "./rubrics/prompt-builder.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const principlesRubric = require("./rubrics/mv-principles-v1.json");
const planChecklist = require("./rubrics/plan-checklist-v1.json");

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4000;
const MAX_INPUT_LENGTH = 15000;

const STATUS_MULTIPLIER = { met: 1.0, partial: 0.5, not_met: 0.0 };
const ELEMENT_SCORE = { present: 2, partial: 1, missing: 0 };

let cachedPrompt = null;

function getSystemPrompt() {
  if (!cachedPrompt) {
    cachedPrompt = buildSystemPrompt();
  }
  return cachedPrompt;
}

function recomputeScores(parsed) {
  const principles = parsed.principle_adherence?.principles;
  if (principles) {
    const principleScores = [];
    for (const [pid, principle] of Object.entries(principles)) {
      const rubricPrinciple = principlesRubric.principles[pid];
      if (!rubricPrinciple || !principle.criteria) continue;
      let principleTotal = 0;
      for (const [cid, criterion] of Object.entries(principle.criteria)) {
        const weight = rubricPrinciple.criteria[cid]?.weight ?? 0;
        const mult = STATUS_MULTIPLIER[criterion.status] ?? 0;
        criterion.score = weight * mult;
        criterion.max_score = weight;
        principleTotal += criterion.score;
      }
      principle.score = principleTotal;
      principleScores.push(principleTotal);
    }
    if (principleScores.length > 0) {
      parsed.principle_adherence.composite_score = Math.round(
        principleScores.reduce((a, b) => a + b, 0) / principleScores.length
      );
    }
  }

  const completeness = parsed.plan_completeness;
  if (completeness?.elements) {
    let structuralIndex = 0;
    for (const [eid, element] of Object.entries(completeness.elements)) {
      const score = ELEMENT_SCORE[element.status] ?? 0;
      element.score = score;
      structuralIndex += score;
    }
    completeness.structural_index = structuralIndex;
    completeness.max_possible = planChecklist.scoring.max_possible;
    completeness.percentage = Math.round(
      (structuralIndex / completeness.max_possible) * 100
    );
  }

  return parsed;
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

    // Parse the inner JSON string, recompute scores, write back
    const textBlock = data.content?.[0]?.text;
    if (textBlock) {
      try {
        const parsed = JSON.parse(textBlock.replace(/```json|```/g, "").trim());
        recomputeScores(parsed);
        data.content[0].text = JSON.stringify(parsed);
      } catch (_) {
        // If inner JSON parse fails, return as-is
      }
    }

    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: "API request failed" });
  }
}
