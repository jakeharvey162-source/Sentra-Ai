export const providers = [
  { id: "gmail", name: "Gmail", detail: "Latest 10 inbox messages", env: "COMPOSIO_GMAIL_AUTH_CONFIG_ID" },
  { id: "outlook", name: "Outlook", detail: "Latest 10 inbox messages", env: "COMPOSIO_OUTLOOK_AUTH_CONFIG_ID" },
  { id: "slack", name: "Slack", detail: "Latest 10 messages in a selected channel", env: "COMPOSIO_SLACK_AUTH_CONFIG_ID" },
] as const;
export type Provider = typeof providers[number]["id"];
export function isProvider(value: unknown): value is Provider { return providers.some(p => p.id === value); }
