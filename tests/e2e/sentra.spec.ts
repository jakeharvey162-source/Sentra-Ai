import { test, expect } from "@playwright/test";

test("home page loads and core navigation is visible", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Sentra AI/);
  await expect(page.getByText("Don\'t trust blindly.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Run Cyber Team/i })).toBeDisabled();
  await expect(page.locator("#protect").getByText("Protect My App", { exact: true })).toBeVisible();
  await expect(page.locator("#team").getByText("Cyber Team", { exact: true })).toBeVisible();
});

test("harmless message completes an investigation", async ({ page }) => {
  await page.goto("/");
  const input = page.getByPlaceholder("Paste a suspicious message or URL...");
  await input.fill("Hi, can we meet tomorrow at 2pm to discuss our class project?");
  await page.getByRole("button", { name: /Run Cyber Team/i }).click();

  await expect(page.getByText("Cyber Jury decision")).toBeVisible();
  await expect(page.getByText("SAFE", { exact: true })).toBeVisible();
  await expect(page.getByText("Scam DNA", { exact: true })).toBeVisible();
});

test("phishing-style message produces evidence and a blocking verdict", async ({ page }) => {
  await page.goto("/");
  const input = page.getByPlaceholder("Paste a suspicious message or URL...");
  await input.fill("URGENT: your account is locked. Sign in immediately and send your verification code.");
  await page.getByRole("button", { name: /Run Cyber Team/i }).click();

  await expect(page.getByText("BLOCK", { exact: true })).toBeVisible();
  await expect(page.getByText("Urgency pressure detected")).toBeVisible();
  await expect(page.getByText("Credential request detected")).toBeVisible();
  await expect(page.getByText(/T1566/)).toBeVisible();
});

test("deceptive URL is identified", async ({ page }) => {
  await page.goto("/");
  const input = page.getByPlaceholder("Paste a suspicious message or URL...");
  await input.fill("Open https://trusted.example@evil.example/login immediately.");
  await page.getByRole("button", { name: /Run Cyber Team/i }).click();

  await expect(page.getByText("URL user-info detected")).toBeVisible();
  await expect(page.getByText("BLOCK", { exact: true })).toBeVisible();
});

test("auth page is usable", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await page.getByText("Need an account? Sign up").click();
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
});


test("capture current Sentra desktop preview", async ({ page }) => {
  await page.goto("/");
  const input = page.getByPlaceholder("Paste a suspicious message or URL...");
  await input.fill("URGENT: your account is locked. Sign in immediately and send your verification code.");
  await page.getByRole("button", { name: /Run Cyber Team/i }).click();
  await expect(page.getByText("BLOCK", { exact: true })).toBeVisible();
  await page.screenshot({ path: "artifacts/sentra-current-desktop.png", fullPage: true });
});
