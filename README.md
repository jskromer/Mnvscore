# M&V Scorecard

An AI-powered evaluation tool for Measurement & Verification plans. Upload a PDF or paste text from any M&V plan, vendor methodology, or program document and get a structured evaluation across two axes.

**Live at [mnvscore.vercel.app](https://mnvscore.vercel.app)**

## What It Does

### Axis 1: M&V Characterization (8 Dimensions)

Profiles the M&V approach across eight dimensions, flagging each as sufficient, limited, or not addressed:

- **Measurement Method** — utility bill analysis, submetering, simulation, etc.
- **Boundary & Scope** — whole facility, system-level, end-use, component
- **Duration & Cadence** — snapshot, short-term, long-term, continuous
- **Use Case Fit** — demand response, EE programs, performance contracts, carbon accounting
- **Savings Isolation** — ability to attribute savings to specific measures
- **Interactive Effects** — captures HVAC-lighting interactions, etc.
- **Baseline Robustness** — normalized, TMY-adjusted, rolling, static
- **Uncertainty Quantification** — confidence intervals, acknowledged, not addressed

### Axis 2: Compliance Evaluation (6 Principles + 11 Elements)

Evaluates plans against the six M&V quality principles (accuracy, completeness, conservativeness, consistency, relevance, transparency) using 26 weighted criteria, plus an 11-element structural completeness checklist. Each criterion receives a met/partial/not_met status with cited evidence from the plan text.

This aligns with IPMVP Core Concepts 2022 Section 6 (principles) and Section 13 (plan requirements) — the same framework Denis Tanguay identifies as defining IPMVP compliance in his February 2026 M&V Focus article.

## Test Plan Library

The `test-plans/` directory contains 8 synthetic M&V plans covering the full range of counterfactual patterns and IPMVP options:

| # | Plan | Pattern | IPMVP Option |
|---|------|---------|--------------|
| 01 | Federal ESPC Fort Carson | Strong baseline, multi-ECM | C |
| 02 | Office Retrofit Chicago | Weak plan, minimal M&V | C (inadequate) |
| 03 | VFD Chilled Water Houston | Equipment isolation | B |
| 04 | LED Lighting Portland Schools | Deemed savings, stipulated hours | A |
| 05 | New Construction ASU | Calibrated simulation | D |
| 06 | Industrial Compressed Air Monterrey | Production-normalized baseline | C |
| 07 | Hybrid Hospital Toronto | Tiered approach, multiple options | A/B/C hybrid |
| 08 | EU Municipal Brno | EN 17267 framework | C |

These plans are designed to exercise the Scorecard across strong and weak plans, all four IPMVP options, international contexts, and different building types and ECM categories.

## Tech Stack

- **Frontend:** React 19 + Vite, single-file app (`src/App.jsx`)
- **Backend:** Vercel serverless functions (`api/`)
- **AI:** Anthropic Claude (Sonnet) for evaluation
- **PDF Parsing:** pdfjs-dist (client-side, no server upload)
- **Deployment:** Vercel

## Development

```bash
npm install
npm run dev
```

## Author

Steve Kromer, CMVP #1 — [Counterfactual Designs](https://counterfactualdesigns.com)

First Certified Measurement & Verification Professional. Author of *The Role of the Measurement and Verification Professional* (Routledge/Taylor & Francis). Steering committee member, OpenEAC Alliance.
