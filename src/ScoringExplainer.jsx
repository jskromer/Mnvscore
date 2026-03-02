import { useState } from "react";

/**
 * ScoringExplainer — In-app "How Scoring Works" panel for M&V Scorecard
 *
 * Drop this into App.jsx and render it conditionally. It matches the existing
 * DM Mono / Syne / warm-earth design system.
 *
 * Usage:
 *   import ScoringExplainer from './ScoringExplainer';
 *   {showExplainer && <ScoringExplainer onClose={() => setShowExplainer(false)} />}
 */

const palette = {
  bg: "#faf8f5",
  card: "#ffffff",
  text: "#3a3a3a",
  heading: "#1a2a3a",
  muted: "#8a7e70",
  accent: "#2a5a8a",
  green: "#5a8a6a",
  border: "#d8d0c4",
  borderLight: "#e8e2da",
  highlight: "#f5f1ec",
};

const PRINCIPLES = [
  {
    name: "Accuracy",
    score_range: "0–100",
    description:
      "Does the plan define how measurements will be taken with sufficient precision? Looks for measurement boundaries, uncertainty quantification, model residual analysis, instrument calibration, and data sufficiency.",
    criteria: [
      "Measurement boundary defined",
      "Uncertainty quantified",
      "Model residual analysis documented",
      "Instrument accuracy & calibration",
      "Data sufficiency justified",
    ],
  },
  {
    name: "Completeness",
    score_range: "0–100",
    description:
      "Does the plan account for all relevant energy flows? Evaluates whether energy streams, adjustments, baseline period, interactive effects, and cost-vs-energy distinctions are addressed.",
    criteria: [
      "All energy streams accounted for",
      "Adjustments explicitly defined",
      "Baseline period justified",
      "Interactive effects addressed",
      "Cost vs energy savings distinguished",
    ],
  },
  {
    name: "Conservativeness",
    score_range: "0–100",
    description:
      "Does the plan err on the side of understating savings when uncertain? Checks whether assumptions are conservative, bias direction is stated, and stipulated values are justified conservatively.",
    criteria: [
      "Conservative assumptions documented",
      "Bias direction stated",
      "Stipulated values justified conservatively",
    ],
  },
  {
    name: "Consistency",
    score_range: "0–100",
    description:
      "Are methods applied uniformly across baseline and reporting periods? Evaluates whether methods, terminology, reporting frequency, and normalization are consistent.",
    criteria: [
      "Methods consistent across periods",
      "Standard M&V terminology used",
      "Reporting frequency consistent",
      "Normalization applied consistently",
    ],
  },
  {
    name: "Relevance",
    score_range: "0–100",
    description:
      "Is the M&V approach appropriate for the project? Checks whether the selected approach is justified, scope is proportional, all ECMs are covered, and stakeholder needs are addressed.",
    criteria: [
      "M&V approach selection justified",
      "Scope proportional to project",
      "All ECMs covered by plan",
      "Stakeholder reporting needs addressed",
    ],
  },
  {
    name: "Transparency",
    score_range: "0–100",
    description:
      "Could a third party reproduce the analysis? Looks for model specification disclosure, data cleaning documentation, exclusion rationale, reproducibility, and explicit assumptions.",
    criteria: [
      "Model specification disclosed",
      "Data cleaning rules documented",
      "Excluded data explained",
      "Analysis reproducible by third party",
      "All assumptions explicitly stated",
    ],
  },
];

const CHECKLIST = [
  { element: "Baseline definition", what: "Period dates, data source, operating conditions, weather data" },
  { element: "Reporting period", what: "Duration, start trigger, end criteria" },
  { element: "Measurement boundary", what: "Systems inside/outside boundary, exclusion rationale" },
  { element: "Routine adjustments", what: "Independent variables, normalization method, data sources" },
  { element: "Non-routine adjustments", what: "Trigger criteria, calculation method, responsible party" },
  { element: "M&V approach selection", what: "Option/method chosen with rationale" },
  { element: "Data sources & collection", what: "Meter types, accuracy, frequency, storage" },
  { element: "Commissioning period", what: "Duration, acceptance criteria, verification" },
  { element: "Uncertainty statement", what: "Numerical bounds, confidence level, sources" },
  { element: "Roles & responsibilities", what: "Data collection, calculations, reviews, disputes" },
  { element: "Documentation retention", what: "Duration, format, access provisions" },
];

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${palette.borderLight}`, padding: "0" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            color: palette.heading,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "14px",
            color: palette.muted,
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            display: "inline-block",
          }}
        >
          ▸
        </span>
      </div>
      {open && (
        <div style={{ paddingBottom: "20px", animation: "slideIn 0.2s ease forwards" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ScoringExplainer({ onClose, inline = false }) {
  const content = (
    <>
      {/* Header */}
      <h2
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: inline ? "18px" : "22px",
          color: palette.heading,
          margin: "0 0 8px 0",
          letterSpacing: "-0.01em",
        }}
      >
        How Scoring Works
      </h2>
      <p style={{ color: palette.muted, margin: "0 0 24px 0", fontSize: "12px" }}>
        Two-axis evaluation: quality principles + structural completeness
      </p>

      {/* Overview */}
      <Section title="Overview" defaultOpen={true}>
        <p style={{ margin: "0 0 12px 0" }}>
          The compliance evaluation scores M&V plans on two independent axes:
        </p>
        <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
          <div
            style={{
              flex: 1,
              background: palette.card,
              border: `1px solid ${palette.borderLight}`,
              padding: "16px",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                color: palette.accent,
                marginBottom: "6px",
              }}
            >
              Axis 1 — Quality Principles
            </div>
            <div style={{ fontSize: "12px", color: palette.muted }}>
              6 principles, 26 weighted criteria.
              <br />
              Composite score 0–100.
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: palette.card,
              border: `1px solid ${palette.borderLight}`,
              padding: "16px",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                color: palette.green,
                marginBottom: "6px",
              }}
            >
              Axis 2 — Structural Completeness
            </div>
            <div style={{ fontSize: "12px", color: palette.muted }}>
              11 plan elements, max 22 points.
              <br />
              Percentage 0–100%.
            </div>
          </div>
        </div>
        <p style={{ margin: "0", fontSize: "12px", color: palette.muted }}>
          Each criterion includes specific evidence from your plan and identifies gaps
          where the plan could be strengthened.
        </p>
      </Section>

      {/* Principles */}
      <Section title="Quality Principles (Axis 1)">
        <p style={{ margin: "0 0 16px 0" }}>
          Each principle is scored 0–100 based on weighted criteria. The composite score is the
          average of all six. Criteria are judged as:
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            fontSize: "12px",
          }}
        >
          <span>
            <strong style={{ color: palette.green }}>met</strong> = full weight
          </span>
          <span>
            <strong style={{ color: palette.accent }}>partial</strong> = half weight
          </span>
          <span>
            <strong style={{ color: palette.muted }}>not met</strong> = zero
          </span>
        </div>
        {PRINCIPLES.map((p) => (
          <div
            key={p.name}
            style={{
              background: palette.card,
              border: `1px solid ${palette.borderLight}`,
              padding: "14px 16px",
              marginBottom: "8px",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                color: palette.heading,
                marginBottom: "6px",
              }}
            >
              {p.name}
            </div>
            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: palette.muted }}>
              {p.description}
            </p>
            <div style={{ fontSize: "11px", color: palette.text }}>
              {p.criteria.map((c, i) => (
                <span key={i}>
                  {c}
                  {i < p.criteria.length - 1 ? " · " : ""}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* Checklist */}
      <Section title="Structural Completeness (Axis 2)">
        <p style={{ margin: "0 0 16px 0" }}>
          Eleven elements that a complete M&V plan should contain. Each is scored: present (2),
          partial (1), or missing (0). Maximum score is 22.
        </p>
        <div
          style={{
            background: palette.card,
            border: `1px solid ${palette.borderLight}`,
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          {CHECKLIST.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                padding: "10px 16px",
                borderBottom: i < CHECKLIST.length - 1 ? `1px solid ${palette.borderLight}` : "none",
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  flex: "0 0 200px",
                  fontWeight: 500,
                  color: palette.heading,
                }}
              >
                {item.element}
              </div>
              <div style={{ color: palette.muted }}>{item.what}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Customization */}
      <Section title="Customization">
        <p style={{ margin: "0 0 12px 0" }}>
          This scoring framework is a reference implementation — a starting point, not a
          standard. The rubrics are stored as versioned JSON files and can be adapted to
          meet the needs of any organization:
        </p>
        <div style={{ fontSize: "12px", color: palette.muted, lineHeight: 1.8 }}>
          <p style={{ margin: "0 0 8px 0" }}>
            <strong style={{ color: palette.text }}>Adjust weights</strong> — Shift
            emphasis between principles or criteria to reflect your program's priorities.
            A utility program might weight Transparency higher; an ESCO might prioritize
            Conservativeness.
          </p>
          <p style={{ margin: "0 0 8px 0" }}>
            <strong style={{ color: palette.text }}>Add criteria</strong> — Insert
            organization-specific requirements, such as data retention policies, specific
            meter classes, or reporting templates.
          </p>
          <p style={{ margin: "0 0 8px 0" }}>
            <strong style={{ color: palette.text }}>Swap rubric sets</strong> — Replace
            the default rubrics entirely with ISO 50015, ASHRAE Guideline 14, or a custom
            organizational standard. The prompt rebuilds automatically from the JSON.
          </p>
          <p style={{ margin: "0" }}>
            <strong style={{ color: palette.text }}>Multiple rubric profiles</strong> — Run
            the same plan through different rubric sets to compare how it scores under
            different frameworks.
          </p>
        </div>
      </Section>

      {/* Footer */}
      <div
        style={{
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: `1px solid ${palette.borderLight}`,
          fontSize: "11px",
          color: palette.muted,
          lineHeight: 1.7,
        }}
      >
        Scoring is deterministic: the AI evaluates status judgments (met / partial / not met),
        then scores are computed server-side from the rubric weights. Criterion scores are
        always weight × status multiplier. Principle scores are always the sum of their
        criteria. The composite is the rounded average of the six principles.
      </div>
    </>
  );

  if (inline) {
    return <div style={{ fontFamily: "DM Mono, monospace", fontSize: "13px", color: palette.text, lineHeight: 1.7 }}>{content}</div>;
  }

  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: "2px",
        padding: "32px",
        maxWidth: "720px",
        margin: "32px auto",
        fontFamily: "DM Mono, monospace",
        fontSize: "13px",
        color: palette.text,
        lineHeight: 1.7,
        position: "relative",
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontFamily: "DM Mono, monospace",
            fontSize: "18px",
            color: palette.muted,
            cursor: "pointer",
            padding: "4px 8px",
          }}
        >
          ×
        </button>
      )}
      {content}
    </div>
  );
}
