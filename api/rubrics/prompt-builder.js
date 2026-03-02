import { createRequire } from "module";

const require = createRequire(import.meta.url);
const principlesRubric = require("./mv-principles-v1.json");
const planChecklist = require("./plan-checklist-v1.json");

function buildPrinciplesSection(rubric) {
  let section = `## AXIS 1: M&V Quality Principles\n\n`;
  section += `Evaluate the M&V plan against these 6 principles. Each principle has weighted criteria.\n`;
  section += `For each criterion, assign a status: "met", "partial", or "not_met".\n`;
  section += `Score = status weight × criterion weight (met=1.0, partial=0.5, not_met=0.0).\n`;
  section += `For partial status, the score is EXACTLY weight × 0.5. For example, a criterion with weight 25 and status "partial" scores exactly 12.5.\n`;
  section += `The principle score = sum of (status_weight × criterion_weight) for all criteria in that principle.\n`;
  section += `Do not independently estimate principle or composite scores — they will be recomputed server-side.\n\n`;

  for (const [principleId, principle] of Object.entries(rubric.principles)) {
    section += `### ${principle.name}\n`;
    section += `${principle.description}\n\n`;
    section += `| ID | Criterion | Weight | Met | Partial | Not Met |\n`;
    section += `|---|---|---|---|---|---|\n`;

    for (const [criterionId, criterion] of Object.entries(principle.criteria)) {
      section += `| ${criterionId} | ${criterion.name} | ${criterion.weight} | ${criterion.met} | ${criterion.partial} | ${criterion.not_met} |\n`;
    }
    section += `\n`;
  }

  return section;
}

function buildChecklistSection(checklist) {
  let section = `## AXIS 2: Plan Structural Completeness\n\n`;
  section += `Evaluate whether the M&V plan contains these 11 structural elements.\n`;
  section += `For each element, assign: "present" (2 points), "partial" (1 point), or "missing" (0 points).\n`;
  section += `structural_index = sum of all element scores. max_possible = ${checklist.scoring.max_possible}.\n`;
  section += `percentage = round(structural_index / max_possible × 100).\n\n`;

  section += `| Element | What to look for | Present | Partial | Missing |\n`;
  section += `|---|---|---|---|---|\n`;

  for (const [elementId, element] of Object.entries(checklist.elements)) {
    section += `| ${element.name} | ${element.look_for} | ${element.present} | ${element.partial} | ${element.missing} |\n`;
  }
  section += `\n`;

  return section;
}

function buildResponseSchema(rubric, checklist) {
  // Build the principles structure dynamically from the rubric
  const principlesExample = {};
  for (const [principleId, principle] of Object.entries(rubric.principles)) {
    const criteriaExample = {};
    for (const criterionId of Object.keys(principle.criteria)) {
      criteriaExample[criterionId] = {
        score: "<number: status_weight × criterion_weight>",
        max_score: "<number: criterion weight>",
        status: "<met|partial|not_met>",
        evidence: "<string: quote or cite specific text from the plan>",
        gap: "<string|null: what is missing, null if met>"
      };
    }
    principlesExample[principleId] = {
      score: "<number: sum of criteria scores, 0-100>",
      criteria: criteriaExample
    };
  }

  // Build the elements structure dynamically from the checklist
  const elementsExample = {};
  for (const elementId of Object.keys(checklist.elements)) {
    elementsExample[elementId] = {
      score: "<number: 0, 1, or 2>",
      status: "<present|partial|missing>",
      evidence: "<string: quote or cite specific text from the plan>",
      section_ref: "<string|null: section reference if identifiable>"
    };
  }

  return JSON.stringify({
    schema_version: "2.0",
    subject: "<string: name/title of the M&V plan being evaluated>",
    summary: "<string: 2-3 sentence plain-language summary of the evaluation>",
    principle_adherence: {
      composite_score: "<number: average of 6 principle scores, 0-100>",
      principles: principlesExample
    },
    plan_completeness: {
      structural_index: "<number: sum of element scores>",
      max_possible: checklist.scoring.max_possible,
      percentage: "<number: structural_index / max_possible × 100>",
      elements: elementsExample
    }
  }, null, 2);
}

export function buildSystemPrompt() {
  const rubric = principlesRubric;
  const checklist = planChecklist;

  let prompt = `You are an expert evaluator of Measurement & Verification (M&V) plans for energy efficiency and demand-side management programs.

You will evaluate an M&V plan across two axes:
1. **M&V Quality Principles** — adherence to 6 universal quality principles (26 criteria total)
2. **Plan Structural Completeness** — presence of 11 essential plan elements

Your evaluation must be protocol-neutral. These are best practices for any rigorous M&V plan, not specific to any single standard or protocol.

IMPORTANT INSTRUCTIONS:
- Evaluate ONLY what is present in the submitted text. Do not assume content that is not stated.
- Cite specific evidence from the plan text for each criterion and element.
- When text is ambiguous, score conservatively (partial rather than met).
- If the text is not an M&V plan, still evaluate it against these criteria — many M&V-adjacent documents contain relevant content.

`;

  prompt += buildPrinciplesSection(rubric);
  prompt += buildChecklistSection(checklist);

  prompt += `## RESPONSE FORMAT

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:

${buildResponseSchema(rubric, checklist)}

CRITICAL: All numeric scores must be actual numbers, not strings. The composite_score must be the arithmetic mean of the 6 principle scores, rounded to the nearest integer.`;

  return prompt;
}
