# Sentra security assessment — October 4, 2026

Scope: jakeharvey162-source/Sentra-Ai and the user-authorized Sentra public app. No testing of unrelated hosts, no credential attacks, no deletion of user data.

## Reproduced and fixed

| Finding | Evidence and fix |
| --- | --- |
| Safety advice classified as credential theft | Live app returned BLOCK and 79/100 for “Never share your password or OTP with anyone.” Context-aware local request detection now excludes safety advice while retaining later theft instructions, including same-sentence attempts. |
| Known phishing subdomains missed | Feed comparison interpolated a literal `${bad}`. Suffix membership checks now cover exact domains and their subdomains without matching unrelated suffix lookalikes. |
| Second malicious URL hidden | Only first URL examined. All distinct submitted HTTP(S) URLs are checked, capped at 20; evidence IDs are unique. |
| Feed outages invisible and expensive | Failed feeds now emit an explicit coverage gap. Concurrent requests share one fetch; failures back off, response bodies and total fetch time are bounded. Submitted links are never fetched. |
| Cross-case AI review contamination | Edited text could be paired with an older verdict, and late reviews could survive newer cases. Case snapshots, generation guards and result clearing prevent this. |
| Automatic third-party SDK and private previews | SDK loads only after explicit sharing consent. Account persistence now requires a separate explicit checkbox and request flag. |
| Weak API resource controls | Bounded JSON stream, input/link limits, content-type and same-origin checks, per-instance throttling and no-store responses. |
| Missing browser hardening | Anti-framing CSP/X-Frame-Options, nosniff, no-referrer, device permission restrictions and removal of powered-by header. |
| Workflow command injection and broad pentest scope | Raw workflow input no longer interpolates into shell code. URL parsing enforces the exact authorized Sentra hostname. |
| Misleading feature and test claims | Planned investigators/scanning are labelled, vote agreement is distinguished from safety probability, tests exercise real implementation, lockfile and npm ci added. |
| Case reference collisions | Timestamp-only identifiers replaced with UUIDs. |
| Persistence/auth failure handling | Failed evidence writes no longer report full persistence; sign-in errors restore the form state. |

## Executed locally

- 28 security regression checks passed against compiled production security modules; phishing-feed behavior uses controlled fixtures.
- Production Next.js build and TypeScript validation passed.
- Production npm dependency audit reported zero vulnerabilities.
- Built-server HTTP tests passed: malformed/type/size/origin rejection, anti-framing and privacy headers, safety advice, phishing, second-link deception, default non-persistence and request throttling.
- Live browser reproduced the original safety-advice false positive before remediation.

Browser suite includes desktop/mobile normal flows, phishing, deceptive links, safety advice, stale-result clearing, untrusted markup, consent gates and provider-failure fallback. Local Chromium download failed (invalid/truncated archive), so these tests must execute in GitHub CI; do not treat test code as proof of execution.

## Strix: not executed

Strix CLI and Docker are absent. No configured Strix LLM provider credentials were found. The official open-source CLI requires Docker and a supported LLM API key. No findings in this report are represented as Strix output. Do not say Strix exploited, certified or cleared this build.

A later authorized Strix run should target a disposable staging deployment, use test accounts, stay inside Sentra's origin and APIs, avoid DoS/credential attacks/real data, record proof-of-concept evidence, then rerun regression tests after each remediation.

## Remaining release gates

- Real AI-provider account/model tests, model-quality and prompt-injection evaluation. Prompt separation is a mitigation, not a security proof.
- Confirm deployed Supabase project, owner policies and evidence-to-case ownership; run two-user/anonymous authorization tests. No database isolation guarantee is inferred from README claims.
- Distributed platform-level throttling. In-memory buckets are a per-instance backstop and reset on restart; they are not a distributed abuse-control guarantee.
- Strix staging pentest, full app scanner, media/identity analysis and automated remediation remain incomplete.
- Heuristic signals and low scores cannot prove safety; adversarial linguistic variations remain possible.
- Full npm audit also reports five development dependency advisories through braces/Tailwind 3 (GHSA-vfj7-8cjw-p6xm); no patched braces version is published. These packages process trusted build patterns rather than submitted case text. Production dependency audit is clean. A Tailwind major-version migration is a separate build-tool remediation, not silently forced here.
- Global CSP is a restrictive baseline for framing/objects, not a full nonce-based script policy.

No finite test suite establishes that every flaw has been eliminated.

## Browser-CI correction

The first browser run caught a legitimate-request rejection introduced by comparing Origin to Next.js' internal request URL. Reproduced with a real Origin header on the built server; fixed using the requested Host authority and covered in both module and HTTP tests. One ambiguous Protect My App selector was also made exact. The browser suite must pass on the corrected commit before merging.


## Public launch hardening follow-up

Added shared, capability-protected Supabase rate buckets (30 investigations/minute, 6 connector actions/minute, 20 saved cases/day). HMAC identifiers avoid storing raw IP addresses. Production fails closed if quota infrastructure is unavailable. Case + evidence saving now uses one server-authorized atomic RPC. A composite parent/owner foreign key prevents attaching owned evidence to another user's case. Text/array limits bound stored payloads.

Live rollback-only fixtures passed atomic save, cross-user case/evidence isolation, parent-owner enforcement, forged capability rejection, anonymous isolation, and the 30-request quota. Fixtures were rolled back. SECURITY DEFINER functions intentionally have narrowly granted execution and validate the secret before quota access; saving additionally requires a non-anonymous auth.uid. Private tables have no client policies or grants.

Rollout: deploy the updated API before revoking direct INSERT/UPDATE table grants. Retain owner-scoped SELECT/DELETE. Provision the secret outside version control; never place its value in a migration.

Strix 1.6.2 installed; local quick scan stopped before testing because Docker is unavailable. Cloud login was rejected by automatic approval review for persistent account and domain-management permissions. No Strix vulnerabilities or successful pentest are claimed. A bounded scan of only the owned hostname still requires an appropriate runtime/account authorization.


Rollout completed: PR #4 merged at be18d1399a91a32668f4d28d2850568ec562acf9; GitHub run 37232541205 passed all steps. Vercel deployment dpl_JBHiCAXV7bieXyDQMCpNVh6nocFP reached READY and production alias updated. Live API samples returned SAFE/0 and BLOCK/72 with persisted=false. Applied `20261004203721_sentra_api_only_storage`; checked authenticated INSERT denied on both tables and owner DELETE retained. Temporary test users are absent.
