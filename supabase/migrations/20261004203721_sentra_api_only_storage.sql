-- Activate only after the atomic-save API is deployed.
revoke insert, update on public.sentra_cases, public.sentra_evidence from anon, authenticated;
