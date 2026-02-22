import { useState } from "react";

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

const DIMENSION_META = {
  measurement_method: { title: "Measurement Method", icon: "◈" },
  boundary_scope: { title: "Boundary & Scope", icon: "⬡" },
  duration_cadence: { title: "Duration & Cadence", icon: "◷" },
  use_case_fit: { title: "Use Case Fit", icon: "◎" },
  savings_isolation: { title: "Savings Isolation", icon: "⊕" },
  interactive_effects: { title: "Interactive Effects", icon: "⋈" },
  baseline_robustness: { title: "Baseline Robustness", icon: "⊞" },
  uncertainty_quantification: { title: "Uncertainty Quantification", icon: "±" },
};

const FLAG_STYLES = {
  sufficient: { bg: "#ecfdf5", border: "#86efac", text: "#166534", dot: "#22c55e" },
  limited: { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", dot: "#f59e0b" },
  not_addressed: { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", dot: "#ef4444" },
};

const FLAG_LABEL = {
  sufficient: "Sufficient",
  limited: "Limited",
  not_addressed: "Not Addressed",
};

const EXAMPLES = [
  {
    label: "WattCarbon (utility bill M&V)",
    text: `WattCarbon's M&V methodology uses utility bill analysis to measure and verify energy savings at the whole-facility level. Monthly utility data is compared against a weather-normalized baseline constructed from 12 months of pre-intervention consumption. Savings are calculated as the difference between predicted and actual consumption, with adjustments for heating and cooling degree days. The methodology is designed for portfolio-scale verification of residential and small commercial energy efficiency programs, where individual submetering is not cost-effective. No confidence intervals or uncertainty bounds are reported on individual project savings.`,
  },
  {
    label: "Demand Response baseline (10-day)",
    text: `For demand response event verification, a 10-business-day baseline is established using the average load profile from the 10 most recent non-event weekdays. Event-day performance is measured against this baseline to calculate load reduction. The baseline uses a same-day morning adjustment factor applied to the average profile. Measurement is at the whole-facility level using interval meter data. This approach is designed for short-duration DR events (2-6 hours) in commercial and industrial facilities.`,
  },
  {
    label: "IPMVP Option B (end-use submetering)",
    text: `This M&V plan uses IPMVP Option B with dedicated submetering of the lighting and HVAC systems affected by the retrofit. Baseline measurements were taken over a 4-week period prior to installation, capturing weekday and weekend operating patterns. Post-installation measurements will continue for 12 months. Savings are calculated at the system level with stipulated values for operating hours based on building management system schedules. Interactive effects between lighting heat gain reduction and HVAC cooling load are estimated using a fixed interaction factor of 0.15 kW-cooling per kW-lighting. Measurement uncertainty is estimated at ±12% at 80% confidence for the lighting system and ±18% for HVAC.`,
  },
];

export default function MNVScorecard() {
  const [input, setText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedDim, setExpandedDim] = useState(null);
  const [fetchedSource, setFetchedSource] = useState(null);

  async function fetchUrl() {
    if (!urlInput.trim()) return;
    setFetching(true);
    setError(null);
    setFetchedSource(null);
    try {
      const response = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await response.json();
      if (data.error) {
        setError(`URL fetch failed: ${data.error}`);
      } else {
        setText(data.text);
        setFetchedSource(urlInput.trim());
      }
    } catch (e) {
      setError("Could not fetch the URL. Check the address and try again.");
    }
    setFetching(false);
  }

  async function analyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Analysis request failed. Please try again.");
        setLoading(false);
        return;
      }
      const text = data.content?.map((b) => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setExpandedDim(null);
    } catch (e) {
      setError("Could not parse the M&V analysis. Please try again.");
    }
    setLoading(false);
  }

  const dims = result ? Object.entries(result.dimensions) : [];
  const flagCounts = result
    ? {
        sufficient: dims.filter(([, v]) => v.flag === "sufficient").length,
        limited: dims.filter(([, v]) => v.flag === "limited").length,
        not_addressed: dims.filter(([, v]) => v.flag === "not_addressed").length,
      }
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        color: "#3a3a3a",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        padding: "0",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f0ede8; }
        ::-webkit-scrollbar-thumb { background: #c8c0b4; border-radius: 2px; }
        textarea { resize: none; }
        textarea::placeholder { color: #b0a898; }
        .dim-row { cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #e8e2da; }
        .dim-row:hover { background: #f5f1ec !important; }
        .dim-row.expanded { background: #f5f1ec !important; }
        .analyze-btn { transition: all 0.2s; }
        .analyze-btn:hover:not(:disabled) { background: #1a3a5c !important; color: #ffffff !important; }
        .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .example-btn { transition: all 0.15s; cursor: pointer; }
        .example-btn:hover { border-color: #7a9ab8 !important; color: #2a5070 !important; }
        .fetch-btn:hover:not(:disabled) { background: #3a6a4a !important; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .slide-in { animation: slideIn 0.3s ease forwards; }
        .spinner { animation: pulse 1.2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #e0d8ce",
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#1a2a3a",
            letterSpacing: -0.5,
          }}
        >
          M&V Scorecard
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#8a7e70",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Measurement & Verification Characterization Tool
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 32px" }}>
        {/* Input Panel */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              color: "#6a8aa8",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Input — M&V Plan, Methodology Description, or URL
          </div>

          {/* URL Fetch Bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a URL to fetch M&V content (e.g., docs.wattcarbon.com/m-and-v/...)"
              onKeyDown={(e) => e.key === "Enter" && fetchUrl()}
              style={{
                flex: 1,
                background: "#ffffff",
                border: "1px solid #d8d0c4",
                borderRadius: 4,
                padding: "10px 14px",
                color: "#3a3a3a",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              onClick={fetchUrl}
              disabled={fetching || !urlInput.trim()}
              style={{
                background: fetching ? "#8a9aaa" : "#5a8a6a",
                color: "#ffffff",
                border: "none",
                borderRadius: 3,
                padding: "10px 20px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 0.5,
                cursor: fetching || !urlInput.trim() ? "not-allowed" : "pointer",
                opacity: fetching || !urlInput.trim() ? 0.5 : 1,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {fetching ? "Fetching..." : "Fetch URL"}
            </button>
          </div>

          {fetchedSource && (
            <div style={{ fontSize: 11, color: "#5a8a6a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              Content loaded from: {fetchedSource.length > 60 ? fetchedSource.slice(0, 57) + "..." : fetchedSource}
            </div>
          )}
          <textarea
            value={input}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste an M&V plan, vendor methodology description, or program documentation..."
            rows={7}
            style={{
              width: "100%",
              background: "#ffffff",
              border: "1px solid #d8d0c4",
              borderRadius: 4,
              padding: "16px",
              color: "#3a3a3a",
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              lineHeight: 1.6,
              outline: "none",
            }}
          />

          {/* Example buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                color: "#8a7e70",
                alignSelf: "center",
                marginRight: 4,
              }}
            >
              Examples:
            </span>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                className="example-btn"
                onClick={() => setText(ex.text)}
                style={{
                  background: "transparent",
                  border: "1px solid #d0c8bc",
                  borderRadius: 3,
                  padding: "4px 10px",
                  fontSize: 11,
                  color: "#7a8e9e",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button
              className="analyze-btn"
              onClick={analyze}
              disabled={loading || !input.trim()}
              style={{
                background: "#2a5a8a",
                color: "#ffffff",
                border: "none",
                borderRadius: 3,
                padding: "10px 28px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 0.5,
                cursor: "pointer",
              }}
            >
              {loading ? "Analyzing..." : "Generate Scorecard"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#8a7e70" }}>
            <div className="spinner" style={{ fontSize: 13, letterSpacing: 2 }}>
              ◈ ANALYZING M&V METHODOLOGY ◈
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 4,
              padding: "12px 16px",
              color: "#991b1b",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="slide-in">
            {/* Subject + Summary */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e0d8ce",
                borderRadius: 4,
                padding: "24px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1a2a3a",
                  marginBottom: 10,
                }}
              >
                {result.subject}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "#5a6a7a" }}>
                {result.summary}
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#8a7e70",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Best Fit:
                  </span>
                  <span
                    style={{
                      background: "#e8f0f8",
                      border: "1px solid #b0cce0",
                      borderRadius: 3,
                      padding: "3px 10px",
                      fontSize: 12,
                      color: "#2a5a8a",
                      fontWeight: 500,
                    }}
                  >
                    {result.use_case_match}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    ["sufficient", "#16a34a"],
                    ["limited", "#d97706"],
                    ["not_addressed", "#dc2626"],
                  ].map(([f, color]) => (
                    <span key={f} style={{ fontSize: 11, color: "#6a7a8a" }}>
                      <span style={{ color, fontWeight: 600 }}>{flagCounts[f]}</span>{" "}
                      {FLAG_LABEL[f]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Dimension rows */}
            <div
              style={{
                border: "1px solid #e0d8ce",
                borderRadius: 4,
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 1fr 140px 120px",
                  background: "#f5f1ec",
                  padding: "8px 16px",
                  borderBottom: "1px solid #e0d8ce",
                }}
              >
                <div />
                <div
                  style={{
                    fontSize: 10,
                    color: "#8a7e70",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Dimension
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#8a7e70",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Finding
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#8a7e70",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </div>
              </div>

              {dims.map(([key, val]) => {
                const meta = DIMENSION_META[key];
                const fs = FLAG_STYLES[val.flag] || FLAG_STYLES.not_addressed;
                const isExpanded = expandedDim === key;

                return (
                  <div key={key}>
                    <div
                      className={`dim-row${isExpanded ? " expanded" : ""}`}
                      onClick={() => setExpandedDim(isExpanded ? null : key)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px 1fr 140px 120px",
                        padding: "12px 16px",
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{ color: "#a0b8cc", fontSize: 14, alignSelf: "center" }}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#8a9aaa",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            marginBottom: 2,
                          }}
                        >
                          {meta.title}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#2a3a4a",
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          {val.label}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#7a8a9a",
                          alignSelf: "center",
                          paddingRight: 8,
                        }}
                      >
                        {val.detail.length > 60
                          ? val.detail.slice(0, 57) + "..."
                          : val.detail}
                      </div>
                      <div style={{ alignSelf: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: fs.bg,
                            border: `1px solid ${fs.border}`,
                            borderRadius: 2,
                            padding: "3px 8px",
                            fontSize: 11,
                            color: fs.text,
                            fontWeight: 500,
                          }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: fs.dot,
                            }}
                          />
                          {FLAG_LABEL[val.flag]}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div
                        style={{
                          background: "#f9f6f2",
                          borderBottom: "1px solid #e0d8ce",
                          padding: "16px 16px 16px 44px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 24,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#a09888",
                                textTransform: "uppercase",
                                letterSpacing: 2,
                                marginBottom: 6,
                              }}
                            >
                              Detail
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#5a6a7a",
                                lineHeight: 1.65,
                              }}
                            >
                              {val.detail}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#a09888",
                                textTransform: "uppercase",
                                letterSpacing: 2,
                                marginBottom: 6,
                              }}
                            >
                              Structural Implication
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#5a6a7a",
                                lineHeight: 1.65,
                                borderLeft: "2px solid #d0c8bc",
                                paddingLeft: 12,
                              }}
                            >
                              {val.inference}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "#b0a898",
                textAlign: "center",
              }}
            >
              Click any row to expand detail and structural implication
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
