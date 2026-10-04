# AI Hardening Stack

Sentra uses several external security projects as defensive test references. They are not bundled wholesale into the customer-facing product.

## Purple Llama

Use cases:
- CyberSecEval-inspired AI security evaluation
- prompt injection and jailbreak testing concepts
- Code Shield ideas for insecure generated code
- input/output safeguard patterns

Important licensing note:
- evals/benchmarks and Code Shield are permissive
- Llama model components use separate Llama community licenses
- Sentra does not vendor model weights by default

## Snyk Agent Scan

Use cases:
- scan agent/MCP/skill configurations for prompt injection and unsafe tool behavior
- inspect sensitive-data handling and suspicious natural-language payloads

Run in a sandbox when inspecting untrusted third-party MCP configuration.

## Cisco AI Defense Skill Scanner

Use cases:
- static/behavioral scanning of agent skills
- source/sink and dataflow checks
- policy-based CI gates
- optional LLM judge only when credentials are configured

## Release rule

A scanner returning no findings is not proof of safety. Sentra treats these as independent evidence sources in the release process.
