# Shannon Red Team Adapter

Sentra uses [KeygraphHQ/Shannon](https://github.com/KeygraphHQ/shannon) as an **external, authorised red-team verifier**.

Shannon is not embedded into Sentra's public product and Sentra does not expose arbitrary-target pentesting to end users.

## Defensive loop

```text
Sentra staging build
      ↓
Shannon white-box pentest
      ↓
Only exploit-validated findings
      ↓
SARIF report
      ↓
Sentra Blue Team normalizer
      ↓
Prioritised remediation queue
      ↓
Human-approved patch
      ↓
Rebuild
      ↓
Shannon re-test
```

## Safety boundary

Run Shannon only against:

- Sentra development/staging deployments owned by the team
- repositories and systems the team has explicit written permission to test
- disposable test data

Do not point it at third-party systems or production customer targets.

## Why this is useful

Shannon's "no exploit, no report" approach makes it a strong verifier for Sentra's own defensive posture. Sentra consumes the verified findings rather than copying Shannon's exploit engine into the product.

## Running Shannon locally

Prerequisites:

- Docker
- Node.js
- an authorised Sentra staging URL
- a Shannon-supported model provider or local model endpoint

Example:

```bash
export SENTRA_AUTHORIZED_TARGET="https://your-sentra-staging.example"
npx @keygraph/shannon@latest start \
  -u "$SENTRA_AUTHORIZED_TARGET" \
  -r "$(pwd)"
```

Keep provider credentials outside Git and follow Shannon's provider setup documentation.

## Importing results into Sentra

When Shannon writes a SARIF report:

```bash
npm run shannon:import -- path/to/report.sarif
```

The importer creates a normalized defensive report in:

```text
test-lab/results/shannon-normalized.json
```

The normalized output contains only finding metadata needed for remediation planning; it does not execute exploits.
