# User control and practical actions

Problem: people could opt into saving investigations but had no app workflow to inspect or remove the resulting sensitive data, and verdicts needed actionable next steps.

Added owner-filtered case/evidence history, bounded pagination, deliberate single/bulk deletion, local-session sign-out, allowlisted post-login destinations and a factual data-handling guide. Deleting cases does not delete the shared authentication account or revoke connected platforms. The interface clears private data on authentication transitions and 401 responses and never treats an upstream delete failure as success.

The API uses the signed-in Supabase client with RLS, not a service-role key. Every case and evidence operation additionally filters the getUser-verified owner. POST operations require same origin and a bounded JSON body; UUIDs and pages are validated, and bulk deletion requires an exact confirmation phrase. Foreign/missing deletes return the same response without disclosing existence. Session sign-out uses scope=local. History/evidence responses are private and no-store.

Live DB test passed: foreign delete denied; own delete cascaded evidence; another user's case/evidence retained; transaction rolled back and fixture users confirmed absent. No real user content was read or deleted.

Added 12 compiled case-service security fixtures and desktop/mobile browser coverage for signed-out history, privacy, evidence text escaping, pagination, canceled and confirmed deletion, failed bulk deletion, sign-out and expired sessions. Existing malicious message/URL regressions remain required.

Safer-action copy follows CISA's phishing guidance: https://www.cisa.gov/sites/default/files/2024-09/Secure-Our-World-Phishing-Tip-Sheet.pdf . No submitted suspicious URL is converted into an action link.

Remaining gates: real connector OAuth/minimum scopes, real AI review, authentication-account deletion without impacting other apps sharing the auth project, monitoring/load/accessibility/multilingual evaluation, and completion of the blocked Strix scan.


## Detection iteration

An exploratory probe found three missed credential requests: "Please send me your one-time code", "Give me your 2FA code", and a password split by U+2060. Added shared security-text normalization for explicit authentication-code aliases, common Unicode dash forms and invisible formatting separators. Added eight malicious examples and five benign/safety-warning regressions; original inputs are not rewritten for display or storage. This is a targeted deterministic improvement, not proof of universal language understanding.
