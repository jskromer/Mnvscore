# M&V Scorecard — Compliance Evaluation Engine

Technical documentation for the compliance evaluation endpoint, rubric schema, and customization guide.

## Architecture

```
api/
  compliance.js                  ← Vercel serverless endpoint (POST /api/compliance)
  rubrics/
    mv-principles-v1.json        ← 6 principles, 26 weighted criteria
    plan-checklist-v1.json       ← 11 structural completeness elements
    prompt-builder.js            ← Constructs system prompt from rubric JSON
```

The compliance endpoint is independent of the existing characterization endpoint (`api/analyze.js`). Both share the same input format but return different response structures.

## How It Works

The evaluation is a two-stage pipeline:

**Stage 1 — AI Status Judgment.** The system prompt (built dynamically from the rubric JSONs by `prompt-builder.js`) instructs the model to read the M&V plan and assign a status to each criterion (`met`, `partial`, `not_met`) and each element (`present`, `partial`, `missing`), with evidence and gap descriptions.

**Stage 2 — Deterministic Score Recomputation.** `recomputeScores()` in `compliance.js` overwrites all numerical scores using fixed arithmetic from the status judgments. The AI never computes final scores — only status. This eliminates LLM arithmetic errors.

Scoring rules:
- Criterion score = `max_score × multiplier` where met=1.0, partial=0.5, not_met=0.0
- Principle score = `Math.round(sum of criteria scores)`
- Composite = `Math.round(average of 6 principle scores)`
- Element score: present=2, partial=1, missing=0
- Structural index = sum of element scores
- Percentage = `Math.round(structural_index / max_possible × 100)`

## API Reference

### `POST /api/compliance`

**Request:**
```json
{
  "content": "Full text of the M&V plan..."
}
```

Content must be a non-empty string, max 15,000 characters.

**Response** (200 OK):

The response wraps the Anthropic API message format. The scored evaluation is in `content[0].text` as a JSON string:

```json
{
  "schema_version": "2.0",
  "subject": "IPMVP Option B Lighting Retrofit M&V Plan",
  "summary": "Brief assessment summary...",

  "principle_adherence": {
    "composite_score": 42,
    "principles": {
      "accuracy": {
        "score": 53,
        "criteria": {
          "acc_boundary": {
            "score": 20,
            "max_score": 20,
            "status": "met",
            "evidence": "Dedicated submetering of lighting and HVAC systems...",
            "gap": null
          },
          "acc_uncertainty": { ... },
          "acc_residual": { ... },
          "acc_calibration": { ... },
          "acc_data_sufficiency": { ... }
        }
      },
      "completeness": { ... },
      "conservativeness": { ... },
      "consistency": { ... },
      "relevance": { ... },
      "transparency": { ... }
    }
  },

  "plan_completeness": {
    "structural_index": 8,
    "max_possible": 22,
    "percentage": 36,
    "elements": {
      "baseline_definition": {
        "score": 1,
        "status": "partial",
        "evidence": "4-week baseline period mentioned but...",
        "section_ref": null
      },
      "reporting_period": { ... },
      "measurement_boundary": { ... },
      "routine_adjustments": { ... },
      "non_routine_adjustments": { ... },
      "mv_approach_selection": { ... },
      "data_collection": { ... },
      "commissioning_period": { ... },
      "uncertainty_statement": { ... },
      "roles_responsibilities": { ... },
      "documentation_retention": { ... }
    }
  }
}
```

**Error responses:**

| Status | Body | Cause |
|--------|------|-------|
| 405 | `{"error":"Method not allowed"}` | Non-POST request |
| 400 | `{"error":"Content is required"}` | Missing or empty content |
| 400 | `{"error":"Content too long..."}` | Exceeds 15,000 chars |
| 500 | `{"error":"API request failed"}` | Anthropic API error |

## Rubric Schema

### `mv-principles-v1.json`

```json
{
  "schema_version": "1.0",
  "name": "M&V Quality Principles",
  "description": "...",
  "scoring": {
    "met": 1.0,
    "partial": 0.5,
    "not_met": 0.0
  },
  "principles": {
    "accuracy": {
      "name": "Accuracy",
      "description": "...",
      "criteria": {
        "acc_boundary": {
          "name": "Measurement boundary defined",
          "weight": 20,
          "met": "Description of what 'met' looks like",
          "partial": "Description of what 'partial' looks like",
          "not_met": "Description of what 'not_met' looks like"
        }
      }
    }
  }
}
```

Key constraints:
- Criteria weights within a principle must sum to 100
- Each criterion must include `met`, `partial`, and `not_met` descriptions
- Criterion IDs must be unique across the entire rubric

### `plan-checklist-v1.json`

```json
{
  "schema_version": "1.0",
  "name": "Plan Structural Completeness",
  "description": "...",
  "scoring": {
    "present": 2,
    "partial": 1,
    "missing": 0,
    "max_possible": 22
  },
  "elements": {
    "baseline_definition": {
      "name": "Baseline definition",
      "what_to_look_for": "Period dates, data source, operating conditions...",
      "present": "Description of what 'present' looks like",
      "partial": "Description of what 'partial' looks like",
      "missing": "Description of what 'missing' looks like"
    }
  }
}
```

Key constraints:
- `max_possible` must equal `number_of_elements × 2`
- Element IDs must be unique

## Customizing the Rubrics

The rubrics are the single source of truth. The system prompt rebuilds automatically from the JSON at startup. To customize the evaluation:

### Adjusting Weights

Change the `weight` values in `mv-principles-v1.json`. Weights within each principle must still sum to 100.

```json
"acc_uncertainty": {
  "weight": 30,  // increased from 25
}
```

### Adding Criteria

Add a new criterion object to the appropriate principle. Update other weights so the principle still sums to 100.

```json
"acc_sampling": {
  "name": "Sampling methodology documented",
  "weight": 10,
  "met": "Sampling plan with confidence/precision targets specified",
  "partial": "Sampling mentioned but methodology not detailed",
  "not_met": "No sampling methodology discussed"
}
```

### Adding Checklist Elements

Add a new element to `plan-checklist-v1.json` and update `max_possible` accordingly.

```json
"stakeholder_signoff": {
  "name": "Stakeholder sign-off provisions",
  "what_to_look_for": "Approval process, signatories, dispute resolution",
  "present": "Sign-off process with named parties and timeline",
  "partial": "Approval mentioned but process not detailed",
  "missing": "No sign-off or approval process described"
}
```

Then update: `"max_possible": 24` (was 22, now 12 elements × 2).

### Swapping Rubric Sets Entirely

Create new JSON files (e.g., `iso-50015-v1.json`, `ashrae-14-v1.json`) following the same schema. Update `prompt-builder.js` to load your new files:

```javascript
function loadJSON(filename) {
  const filepath = join(__dirname, filename);
  return JSON.parse(readFileSync(filepath, "utf-8"));
}

// Change these to point to your rubric files:
const principles = loadJSON("iso-50015-principles-v1.json");
const checklist = loadJSON("iso-50015-checklist-v1.json");
```

The prompt builder will construct the appropriate system prompt from whatever JSON you provide, as long as it follows the schema above.

### Running Multiple Rubric Profiles

To evaluate the same plan against different rubric sets, create multiple endpoints:

```
api/
  compliance.js           ← default rubrics
  compliance-iso.js       ← ISO 50015 rubrics
  compliance-custom.js    ← organization-specific rubrics
```

Each imports `prompt-builder.js` configured with its own JSON files. The `recomputeScores()` function works with any rubric set — it reads the structure from the response itself.

## Deployment

```bash
git add api/compliance.js api/rubrics/
git commit -m "Update compliance evaluation"
git push origin main
```

Vercel automatically deploys. The `vercel.json` routes all `/api/*` paths to serverless functions. The compliance function has `maxDuration: 60` to handle the larger system prompt and response.

## Cost and Performance

Per evaluation (approximate):
- Input tokens: ~7,500 (system prompt ~6,500 + plan content)
- Output tokens: ~3,000
- Model: claude-sonnet-4-20250514
- Latency: 8–15 seconds typical, up to 25 seconds on cold starts
- The system prompt is cached in-memory per Vercel function instance

## This Is a Starting Point

The default rubrics encode universal M&V best practices. They are not the only valid way to evaluate a plan. Organizations should treat this as a reference implementation and adapt the criteria, weights, and scoring to match their specific program requirements, regulatory context, and quality expectations. The architecture is designed to make that adaptation straightforward.
