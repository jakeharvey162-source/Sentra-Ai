# Sentra AI

> **Don't trust blindly. Investigate intelligently.**

Sentra AI is an evidence-driven **AI Cyber Investigation Network** built for **ForgeHacks Online 2026 — AI + Cybersecurity**.

Sentra investigates suspicious digital interactions with multiple specialist checks, deterministic security logic, explainable evidence, a Challenger and a Cyber Jury instead of asking one model to make a black-box decision.

## Hackathon

- Event: ForgeHacks Online 2026
- Track: AI + Cybersecurity
- Build period: October 3–10, 2026
- Team size: 3
- Project work in this repository is being built during the hackathon period
- Open-source libraries, public datasets and pretrained AI models are used where appropriate

## What works today

### Protect Me — working alpha

The current interface accepts **messages and URLs** and returns:

- evidence signals from specialist investigators
- risk score
- SAFE / VERIFY / HOLD / BLOCK / ESCALATE action
- MITRE ATT&CK technique mapping
- Challenger / Devil's Advocate review
- Cyber Jury vote and confidence
- Scam DNA fingerprint
- threat-graph data structure
- plain-language explanation

Current deterministic agents:

- Phishing Investigator
- URL Investigator

### Accounts and persistence

Sentra uses Supabase for authentication and investigation persistence.

Database tables:

- `sentra_cases`
- `sentra_evidence`

Both tables have Row Level Security enabled. Owner-scoped SELECT and DELETE remain available to signed-in users. Direct INSERT and UPDATE grants are revoked; saving uses an atomic, authenticated server-authorized operation with a daily quota. Evidence has a composite case/owner foreign key.

Unauthenticated visitors can still run the local deterministic investigation layer; authenticated users can explicitly opt in to persist supported investigations. Case previews are not saved by default.

### Protect My App

The UI and defensive architecture are present, but full repository/API/application scanning is **not yet presented as complete**. The target must be owned by, or explicitly authorised to, the user before any active security testing is performed.

## Sentra decision pipeline

```text
User input
   ↓
Input security / privacy boundary
   ↓
Specialist investigators
   ↓
Evidence Engine
   ↓
MITRE ATT&CK context
   ↓
Challenger / Devil's Advocate
   ↓
Cyber Jury
   ↓
Scam DNA + Threat Graph
   ↓
SAFE / VERIFY / HOLD / BLOCK / ESCALATE
   ↓
Explainable result
```

**Sentra does not treat absence of evidence as proof of safety.**

## AI layer

Sentra's deterministic cyber-security logic remains usable without a hosted LLM.

For model-backed review, Sentra now includes an optional **Puter.js AI Council**. It can ask GPT, Claude and Gemini to independently review the deterministic result through Puter's user-pays architecture, without requiring separate developer API keys. The core verdict remains available even when Puter is unavailable.

Planned roles for model-backed review:

- social-engineering interpretation
- screenshot/document understanding
- explanation simplification
- independent jury opinions
- adversarial Challenger review
- multimodal investigation

LLM output is treated as **evidence**, not automatic truth.

## Security and test lab

Sentra's release gate currently covers:

- production dependency audit
- deterministic security-core tests
- Next.js production build and type validation
- committed-secret scanning
- Playwright desktop browser flows
- Playwright mobile browser flows

Additional defensive tooling prepared or planned:

- Promptfoo — prompt-injection and model evaluation
- NVIDIA Garak — LLM vulnerability probing
- Purple Llama — AI security evaluation concepts
- Snyk Agent Scan — agent/MCP/skill risk
- Cisco AI Defense Skill Scanner — agent skill supply-chain scanning
- Browser Use — synthetic user evaluation
- Strix — authorised staging application/API pentesting

A tool returning no findings is **not proof of security**. Test results are reported only when they have actually executed.

## Current browser test scenarios

Automated user-style tests cover:

1. landing page and primary navigation
2. harmless message investigation
3. phishing / credential-theft message
4. deceptive URL containing URL user-info
5. authentication UI
6. desktop viewport
7. mobile viewport

## Security data / standards

Current:

- MITRE ATT&CK mapping subset
- local structural URL checks
- local phishing/social-engineering checks

Optional future/live integrations:

- Phishing.Database active phishing feed (free GitHub-hosted threat intelligence)
- VirusTotal
- URLhaus
- PhishTank
- C2PA provenance
- full MITRE ATT&CK STIX dataset

Confidential files should never be automatically uploaded to third-party reputation services.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide
- Supabase Auth + Postgres + RLS
- Playwright
- GitHub Actions

## Local setup

Requirements:

- Node.js 24+
- npm

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

Required Supabase environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Optional threat-intelligence variables:

```bash
VIRUSTOTAL_API_KEY=
```

Never commit real secrets.

## Tests

Core security logic:

```bash
npm run test:security
```

Browser user flows:

```bash
npx playwright install chromium
npm run build
npm run test:http
npm run test:e2e
```

Production build:

```bash
npm run build
```

## What is not complete yet

The following are roadmap or partial features and should not be demonstrated as fully working until implemented and tested:

- screenshot/image investigation
- QR investigation
- document/file analysis
- audio/voice-note investigation
- video/deepfake investigation
- full threat-intelligence aggregation
- full MITRE STIX ingestion
- visual Threat Graph interface
- case-history dashboard
- Simple / Expert modes
- Panic Mode
- browser guardian
- full Protect My App scanner
- Cyber Twin
- organisation dashboard
- automated remediation / PR generation
- completed Strix staging pentest

## Security principles

- high-impact actions require human approval
- external links are not fetched blindly
- user content is treated as untrusted
- secrets remain server-side when a provider requires them
- ownership / authorisation is required before application security testing
- private documents are not automatically sent to public malware services
- model responses never override deterministic security evidence by themselves
- evidence confidence and uncertainty are surfaced rather than hidden

## Attribution

Sentra is original hackathon work and selectively learns from / integrates open-source security tooling and standards including MITRE ATT&CK, Microsoft Agent Framework concepts, Purple Llama, Promptfoo, Garak, Snyk Agent Scan, Cisco AI Defense Skill Scanner, Browser Use and Strix.

Each upstream project's own licence and terms apply. Sentra does not vendor restricted or enterprise-only source code.

## Submission integrity

We distinguish between:

- **working + tested**
- **implemented but experimental**
- **planned / roadmap**

The ForgeHacks demo will show real executed functionality only.

---

**Sentra AI — Evidence before confidence.**

## October 4 security hardening

See [the assessment](test-lab/SECURITY-ASSESSMENT-2026-10-04.md) for reproduced failures, fixes, executed checks and remaining gaps. The security suite compiles and tests the actual TypeScript implementation with isolated feed fixtures, rather than copying implementation logic into tests.

AI Council is experimental. It uses explicit consent, case snapshots, system/user message separation, plain-text rendering, bounded output and timeouts. Its SDK is loaded only on opt-in. Model availability and live reviewer quality require a real provider-account test; local rules are not a trained ML model.

Protect My App is an experimental workflow, not a shipped web scanner. Identity and media investigators are planned. UI labels reflect these boundaries.

ForgeHacks' released cybersecurity prompt focuses on helping people recognize, prevent, verify or respond to scams, impersonation and fraud enabled by AI or modern technologies. Sentra's message/URL investigation addresses that scope; judges must also see real model-backed review to assess AI use. See [the submission checklist](test-lab/FORGEHACKS-READINESS.md).

## Connected email and platform protection

Open `/connections` to manage Composio account connections and scan recent Gmail, Outlook or Slack messages. Optional checks repeat every minute while the page is open. Credentials remain with Composio; scanning does not send, delete or modify messages and does not send mailbox content to the AI Council.

**Activation required:** connection buttons remain disabled until the administrator configures the Composio project key, platform auth configs, callback identity verifier and read scopes. See [setup, security boundaries and live-test checklist](test-lab/CONNECTED-PROTECTION.md). Fixture-tested adapters are not proof of live OAuth, background monitoring or full mailbox coverage.


## Public launch status — October 4, 2026

Working alpha, not yet verified for worldwide production use. PR #4 passed production dependency audit, 30 security regressions, 19 connector fixture checks, 6 rate checks, HTTP boundaries, 26 desktop/mobile browser tests, build/type checks and secret scanning. Production deployment was verified with normal and malicious sample investigations; live DB rollback fixtures proved ownership isolation and forged-capability denial.

Still required before broad launch: real Gmail/Outlook/Slack OAuth and minimum-scope verification, genuine model-backed AI Council testing, self-service authentication-account deletion, operational monitoring and incident handling, privacy/retention documentation, measured load tests, accessibility and multilingual detector evaluation. Development-only dependency advisories remain documented in the security assessment.

Strix 1.6.2 is installed but has not completed a scan. Docker is missing locally; cloud login was blocked by automatic approval review over persistent account/domain-management access. Do not describe the app as Strix-certified or vulnerability-free.

Pitch production script: [four-minute script](test-lab/FOUR-MINUTE-PITCH.md). A 240-second silent visual draft was rendered with Higgsfield; final narration, real app footage and Sparki editing remain pending authorization. The AI-track demonstration must show actual trained-model use.

### Database secret provisioning

Apply the Sentra migrations to a Supabase project containing the case tables. Generate a cryptographically random 32-byte server secret (64 lowercase hex characters), store it as `SENTRA_SERVER_SECRET` in deployment environment variables, and insert only its SHA-256 hash into `sentra_private.server_config` as the sole `id=true` row using an administrator connection. Never expose the value in browser variables, SQL migration files, logs or Git. Configure the matching public Supabase URL and publishable key. Deploy the updated API before applying `sentra_api_only_storage`. Production quota failures return 503 rather than silently bypassing limits.


## User control — October 6, 2026

- `/cases`: private paginated history, evidence review, individual deletion, confirmed bulk deletion and current-session sign-out. All API queries include the server-verified owner alongside RLS; no service-role credential is used. Deleting a case cascades its evidence. Account deletion remains separate and unavailable.
- `/privacy`: describes submitted data, optional saving, evidence fragments, retention, AI/provider sharing, connections and the limits of deletion.
- Investigations now provide practical verification/reporting steps, and failed saving is surfaced instead of hidden.
- Login returns to a fixed allowed destination, including Connections and Saved cases; arbitrary redirects are rejected.

Verification includes compiled case-service hostile-request fixtures, production HTTP checks, desktop/mobile browser flows and rollback-only live DB deletion/isolation checks. Provider fixtures do not constitute live OAuth or AI verification.
