# Project: M&V Scorecard

An AI-powered Measurement & Verification characterization tool that analyzes M&V plans across 8 dimensions using Claude's API.

## Key Commands
- `npm run dev` — local dev server (Vite)
- `npm run build` — production build to /dist
- `git push origin main` — triggers Vercel auto-deploy

## Tech Stack
- **Frontend:** React 19 + Vite 7, single-file app in `src/App.jsx`
- **Backend:** Vercel serverless functions in `api/`
- **API:** Anthropic Claude (claude-sonnet-4-20250514) via `/api/analyze.js`
- **Deployment:** Vercel at https://mnvscore.vercel.app
- **Repo:** https://github.com/jskromer/Mnvscore

## Project Structure
```
src/App.jsx          — Main React component (entire UI + logic)
src/main.jsx         — React entry point
api/analyze.js       — Vercel serverless proxy to Anthropic API
api/fetch-url.js     — Vercel serverless URL content fetcher
index.html           — Vite HTML entry
vercel.json          — Vercel routing config
```

## Architecture
- App.jsx is a single-file React component with inline styles
- No external CSS framework — all styles are inline or in a `<style>` tag
- Fonts: DM Mono (body) + Syne (headings) via Google Fonts
- Color theme: Light cream (#faf8f5) background with white cards, warm tan accents, navy blue (#2a5a8a) primary buttons
- The app calls `/api/analyze` which proxies to Anthropic's API server-side (avoids CORS + keeps API key secure)
- URL fetch feature: `/api/fetch-url` strips HTML and returns plain text for analysis

## Environment Variables (Vercel)
- `ANTHROPIC_API_KEY` — required, set in Vercel project settings

## M&V Domain Context
The tool evaluates M&V (Measurement & Verification) plans across 8 dimensions:
1. **Measurement Method** — utility bill analysis, submetering, simulation, etc.
2. **Boundary & Scope** — whole facility, system-level, end-use, component
3. **Duration & Cadence** — snapshot, short-term, long-term, continuous
4. **Use Case Fit** — demand response, EE programs, performance contracts, carbon accounting
5. **Savings Isolation** — ability to attribute savings to specific measures
6. **Interactive Effects** — captures HVAC-lighting interactions, etc.
7. **Baseline Robustness** — normalized, TMY-adjusted, rolling, static
8. **Uncertainty Quantification** — confidence intervals, acknowledged, not addressed

Each dimension gets a flag: sufficient, limited, or not_addressed.

Key industry references:
- IPMVP (International Performance M&V Protocol) — Options A/B/C/D
- OpenEAC Alliance (https://methods.openeac.org) — WattCarbon's open methodology repo
- CalTRACK, ASHRAE Guideline 14, Uniform Methods Project
- WattCarbon Aristotle platform — automated M&V

## Style Guide
- Monospace UI with a technical/analytical feel
- Cream/white background — NOT dark mode
- Status badges: green (sufficient), amber (limited), red (not addressed)
- Expandable rows for dimension detail + structural implications
- Keep the app as a single-file component unless complexity requires splitting

## Important Context
- Owner: Steve Kromer (jskromer on GitHub, steering committee member of OpenEAC Alliance)
- The tool is designed for M&V professionals evaluating vendor methodologies
- Example inputs include WattCarbon, Demand Response baselines, and IPMVP Option B plans
- The system prompt in App.jsx defines the JSON schema Claude must return
