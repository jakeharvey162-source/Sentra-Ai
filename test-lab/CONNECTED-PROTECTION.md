# Connected protection — Composio

Sentra now includes `/connections`, authenticated connection management and bounded, read-only message scanning through Composio's official REST v3.1 API. This is an adapter integration with [Composio's open-source project](https://github.com/ComposioHQ/composio), not a wholesale merge of its code. Provider credentials remain with Composio. No new npm package or database table is needed.

## Administrator activation

This code is intentionally disabled until the project is configured. Do not advertise live OAuth before completing the steps below.

1. Create a dedicated Sentra project in [Composio](https://dashboard.composio.dev). Keep production and testing separate.
2. Configure the project's **OAuth callback identity verifier** to `https://sentra-ai-7lij.vercel.app/api/connections/callback` under Settings → General → Configuration. This is required to prevent copied Connect Links attaching a victim's account to an attacker's Sentra identity. A normal callback URL alone does not enable verification.
3. Create OAuth2 auth configs for the `gmail`, `outlook`, and `slack` toolkits, only for platforms you will support. Request minimum read scopes: Gmail `gmail.readonly`; Outlook delegated `Mail.Read` (plus the identity/refresh scopes needed by OAuth); Slack only history scopes for supported conversations, without message-write/admin permissions. Check actual provider consent screens. Composio-managed OAuth availability does not guarantee its default scopes are minimal; use custom OAuth credentials if necessary to restrict them.
4. Put the project API key, configured platform auth-config IDs and fixed app origin from `.env.example` into Vercel server environment settings. Never use `NEXT_PUBLIC_` for these secrets and never paste them into GitHub or chat. Set `COMPOSIO_CALLBACK_VERIFICATION_ENABLED=true` and `COMPOSIO_READ_ONLY_SCOPES_VERIFIED=true` only after the settings and scopes have been verified. Deploy again.
5. Ensure Sentra Supabase authentication is configured. Connections use the verified, non-anonymous `getUser()` ID. An OAuth account is not activated from browser-supplied identity, email or callback account IDs.
6. Use disposable test accounts to complete OAuth for each enabled platform. Test Alice/Bob isolation, copied authorization links, expired/single-use callback sessions, revoked permissions, actual provider response formats and disconnect. Server fixture tests are not substitutes for these live checks.
7. Check provider quotas and Composio billing. This adapter can consume Composio operations; it does not promise unlimited free scanning. Configure distributed platform rate controls before opening public registrations at scale.

## User flow

Sign in → Connections → consent → Connect platform → review provider permissions → return to Sentra → choose account → Scan recent messages. Gmail and Outlook inspect at most the latest 10 inbox messages; Slack requires a channel ID accessible to the account. Optional monitoring repeats scans each minute while the page is open and visible. It stops on error, revoked consent, account selection changes or page closure. It is not a background service or a webhook subscription.

The page shows each inspected message's verdict, score, sender/title and supporting evidence. It does not return complete bodies. HTML is converted to text, preserving hidden link destinations. Oversized or missing bodies are reported as incomplete; an incomplete SAFE result becomes HOLD. Attachments, embedded images and older messages are outside coverage. Disconnect revokes the connection through Composio; upstream grant revocation is provider-dependent, so users can also remove the grant in their platform settings.

## Security boundaries

- Every list, scan and revoke verifies ownership, configured auth-config ID and toolkit. Shared accounts are excluded. Inactive/disabled accounts cannot scan.
- No caller-selected endpoint, tool, user ID, HTTP method, OAuth scopes or auth-config ID is executed. Proxy calls are fixed GET requests to official Gmail, Microsoft Graph and Slack APIs.
- New links require literal consent, a signed-in account, a valid Origin and matching OAuth auth config. Authorization redirects are restricted to HTTPS `connect.composio.dev`.
- A signed, ten-minute `__Host-` HttpOnly Secure SameSite=Lax pending cookie binds user, platform and expected connection. The callback redeems the opaque `session_uri` with Composio under the server-authenticated user, verifies the expected account, and clears the cookie. The URI is never fetched as a URL or reflected into a redirect.
- Credentials and raw upstream errors are not returned to the browser. Responses use no-store. Request bodies are bounded to 4KB and upstream bodies to 2MB; individual operations have 12s timeouts and message reads share a 30s deadline. Partial provider failures return an error instead of an apparently complete report.
- Scans do not persist messages or send content to an LLM. The local detector inspects text; the fixed community phishing feed receives no mailbox contents or submitted URLs.
- Per-instance rate limiting is a backstop, not a distributed quota. No promise of complete scam detection, identity verification, attachment safety or guaranteed SAFE classification is made.

## Validation

`npm run test:security`, `npm run test:connectors`, `npm run build`, `npm run test:http`, and desktop/mobile `npm run test:e2e`.

Connector tests compile the actual implementation and use fixture upstream responses. They exercise cross-user scan/revoke denial, owner-only redacted listings, malicious account IDs, inactive/shared account rejection, fixed read requests, consent, OAuth cookie tampering/user mismatch/expiry, callback binding, redirect allowlisting, bounded payloads, hidden HTML links and disconnect. Browser fixtures exercise consent, result rendering/XSS resistance, stale-result clearing and disconnect. These do **not** demonstrate successful live Composio OAuth or provider access; those require the administrator activation above.

Strix has not been run: this workspace has no Strix runtime, Docker daemon or configured LLM provider key. Keep the distinction between deterministic regression tests and an actual Strix penetration-test report.

## Primary references

- https://docs.composio.dev/reference/api-reference/connected-accounts
- https://docs.composio.dev/reference/api-reference/connected-accounts/postConnectedAccountsCompleteAuth
- https://docs.composio.dev/reference/api-reference/tools/postToolsExecuteProxy
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get
- https://learn.microsoft.com/en-us/graph/api/user-list-messages
- https://docs.slack.dev/reference/methods/conversations.history/
