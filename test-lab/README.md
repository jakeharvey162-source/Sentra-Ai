# Sentra Test Lab

This folder contains defensive testing plans and configurations for systems owned by the Sentra team or explicitly authorised for testing.

## Layers

### 1. Deterministic core tests
Run locally without external credentials:

```bash
node tests/security-core.mjs
```

### 2. Promptfoo
Purpose: evaluate Sentra's AI-facing surfaces for prompt injection, data leakage, excessive agency, unsafe tool use, and inconsistent verdicts.

We will enable this when a model-backed Sentra endpoint exists. Test cases must target Sentra's own staging environment only.

### 3. NVIDIA Garak
Purpose: probe the language-model layer for known LLM failure modes.

Use after the model provider and agent runtime are connected. Garak is not bundled into the customer-facing app.

### 4. Browser Use
Purpose: synthetic users and UX regression.

Personas:
- first-time user
- low-tech user
- mobile-only user
- small-business owner
- security analyst
- accessibility-focused user

Tasks should verify discoverability, completion, comprehension and error recovery.

### 5. Strix
Purpose: authorised application/API security testing of Sentra's own codebase and staging deployment.

Do not run Strix against third-party systems without explicit written permission.

## Hackathon reporting

Only measured results are reported. We will not invent pass rates, detection rates, or vulnerability counts.
