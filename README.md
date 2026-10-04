# Sentra AI

**Sentra is an AI Cyber Defense Team that investigates suspicious digital interactions and helps people, developers, and organisations understand what is risky, why it is risky, and what to do next.**

Built for **ForgeHacks 2026 — AI + Cybersecurity**.

## Current build

The repository contains the first Sentra product foundation:

- premium responsive Next.js interface
- public investigation experience
- Cyber Team agent presentation
- explainable risk/evidence UI
- Cyber Jury decision surface
- Protect My App experience
- environment-variable scaffolding for security integrations

## Product principles

Sentra does **not** claim one AI model can determine truth.

The intended decision pipeline is:

```text
Input
  ↓
Privacy + input security gates
  ↓
Specialist investigators
  ↓
Independent threat intelligence
  ↓
Evidence Engine
  ↓
Challenger / Devil's Advocate
  ↓
Cyber Jury
  ↓
SAFE / VERIFY / HOLD / BLOCK / ESCALATE
  ↓
Explainable evidence + recommended action
```

Absence of provenance is not treated as proof of manipulation. High-impact actions remain human-controlled. Uploaded content is always treated as untrusted data.

## Core product modes

### Protect Me
Users can submit suspicious URLs, messages, files, documents, screenshots, QR codes, images, audio and eventually video for investigation.

### Protect My App
Developers and organisations can connect an authorised repository, API or deployed application. Sentra maps the defensive attack surface, prioritises findings and produces evidence-backed remediation guidance.

## Differentiators

- Multi-agent Cyber Team with separate responsibilities
- Evidence Engine instead of one opaque classifier
- Challenger / Devil's Advocate that tries to disprove the initial conclusion
- Cyber Jury for high-risk ambiguous cases
- Scam DNA for attack-family similarity
- Threat Graph for connected infrastructure and incidents
- Cyber Twin for visualising an application's defensive attack surface
- Simple and expert explanations from the same evidence
- Human approval for consequential actions

## Frontend design system

Sentra uses an original interface built on React/Tailwind patterns compatible with:

- **shadcn/ui** for accessible application primitives
- **Tremor** concepts/components for security analytics and dashboards
- **Magic UI** patterns for selective motion and polish

We intentionally do **not** vendor whole upstream design repositories into Sentra. Components are integrated selectively so the product remains original and maintainable.

## Planned security integrations

- Google Web Risk
- VirusTotal
- URLhaus / phishing intelligence
- MITRE ATT&CK knowledge
- C2PA provenance verification
- Promptfoo / NVIDIA Garak for AI red-team testing
- browser automation for synthetic user testing

API secrets must never be committed. Copy `.env.example` to `.env.local` during local development and add only the credentials required for enabled integrations.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Production build

```bash
npm run build
npm start
```

## Hackathon integrity

Sentra distinguishes between:

- **implemented and tested**
- **implemented but experimental**
- **planned / roadmap**

We will not present roadmap capabilities as working features in the demo.

## Roadmap before submission

1. Working URL/message investigation flow
2. Evidence Engine and deterministic risk scoring
3. Threat-intelligence adapters
4. Case history and persistence
5. Protect My App defensive scanning
6. Scam DNA and Threat Graph prototype
7. Automated red-team tests
8. Synthetic-user UX tests
9. Deployment and public demo
10. 2–4 minute ForgeHacks pitch/demo video

---

> **Sentra — don't trust blindly. Investigate intelligently.**
