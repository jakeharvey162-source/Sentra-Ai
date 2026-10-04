# Sentra — four-minute pitch production script

Status: reviewable production draft, not a completed narrated demo. Twelve 20-second sections, exactly 240 seconds. Record real product demonstrations for sections 2–6. Do not substitute mocked outputs for the required live AI proof.

## 0:00–0:20 — A message can look familiar and still be dangerous

Sentra helps students and everyday users pause before a scam becomes a stolen account. A familiar logo, an urgent deadline, or a believable sender is not enough to trust a message. Our goal is to make the evidence understandable before someone clicks or shares a code.

## 0:20–0:40 — Investigate before you click

Paste a suspicious message or link into Protect Me. Sentra checks the text and each distinct link, then returns an action with reasons. Users can inspect the evidence instead of relying on a mysterious safe or unsafe label. The interface also makes uncertainty visible.

## 0:40–1:00 — Normal messages deserve normal results

The demonstration should start with an ordinary message, then a safety warning that mentions a password without requesting one. These regression cases test whether the detector understands useful context. A warning about credential theft should not itself become a credential-theft alarm.

## 1:00–1:20 — Show the actual credential-theft test

Next, paste an urgent request to send a password or one-time code. Show the real result and open its evidence. Explain the pressure and credential-request signals, and the safer next step: verify through an independently trusted channel rather than replying to the suspicious sender.

## 1:20–1:40 — Every link matters

Now demonstrate a harmless first link followed by a deceptive second link. Sentra examines all distinct links within a bounded request. It recognizes misleading URL structures and known phishing domains. It does not visit arbitrary user-submitted destinations, which also reduces exposure to server-side request attacks.

## 1:40–2:00 — Evidence before confidence

Results combine specialist checks, an evidence engine, a challenger review, and a final action. Feed coverage is shown explicitly. An unavailable threat feed is a gap in evidence, not proof of safety. Additional AI opinions are not allowed to erase strong local indicators.

## 2:00–2:20 — AI review requires consent and real proof

The optional AI Council sends content to selected model providers only after consent. A final submission needs a genuine model-backed demonstration and captured output. Until that test is completed, describe this as an optional integration rather than claiming verified live AI protection.

## 2:20–2:40 — Bring protection closer to the inbox

We added guarded connection adapters for Gmail, Outlook, and Slack through Composio. The intended flow is sign in, authorize a read-only account, and scan recent messages. Live provider credentials and read-only scopes still need verification, so today the public interface honestly shows the setup requirement.

## 2:40–3:00 — Privacy is part of the product

Investigations are not stored by default. Saving is an explicit choice tied to the authenticated user. The server binds saved records to that identity, and case evidence must belong to the same owner. Connected-message checks avoid persisting message bodies or automatically sharing them with language models.

## 3:00–3:20 — Test boundaries, not just happy paths

Our regression suite checks deceptive links, credential requests, input limits, ownership, callback binding, and provider destinations. Live database tests confirmed cross-user isolation and rejected forged server capabilities. Shared quotas now enforce limits across server instances, and case saving is atomic.

## 3:20–3:40 — Be precise about what is ready

Sentra is a working alpha for message and URL investigation. Strix has not completed a scan: the local runtime lacks Docker and cloud authorization remains blocked. Before broad launch, we still need live connector and AI tests, operational monitoring, and measured load and multilingual performance.

## 3:40–4:00 — Make verification a habit

For ForgeHacks AI and Cybersecurity, our focus is practical scam recognition and safer decisions. Sentra explains why a message deserves caution and what the user can do next. The submission will link the deployed app, public code, real demonstrations, and the remaining limitations. Investigate intelligently before you trust blindly.

Sparki edit brief: Produce a 16:9 pitch of no more than 240 seconds. Use the recorded real app footage and this narration. Add readable burned-in captions, restrained transitions, and clear labels for optional or unverified integrations. Preserve the factual limitations and leave URLs readable in the closing frame. Do not invent connected accounts, AI results, security scan findings, or usage metrics.
