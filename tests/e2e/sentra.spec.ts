import { test, expect } from "@playwright/test";

test("home page loads and core navigation is visible", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Sentra AI/);
  await expect(page.getByText("Security is mostly")).toBeVisible();
  await expect(page.getByRole("button", { name: /Run Cyber Team/i })).toBeDisabled();
  await expect(page.locator("#protect").getByText(/protect my app/i)).toBeVisible();
  await expect(page.locator("#team").getByText("Most cyber defense is")).toBeVisible();
});

test("harmless message completes an investigation", async ({ page }) => {
  await page.goto("/");
  const input = page.getByPlaceholder("Paste a suspicious message or URL...");
  await input.fill("Hi, can we meet tomorrow at 2pm to discuss our class project?");
  await page.getByRole("button", { name: /Run Cyber Team/i }).click();

  await expect(page.getByText("Cyber Jury", { exact: true })).toBeVisible();
  await expect(page.getByText("SAFE", { exact: true })).toBeVisible();
  await expect(page.getByText("Scam DNA", { exact: true }).last()).toBeVisible();
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


test("safety advice does not become credential theft", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Paste a suspicious message or URL...").fill("Never share your password or OTP with anyone.");
  await page.getByRole("button", { name: "Run Cyber Team", exact: true }).click();
  await expect(page.getByText("SAFE", { exact: true })).toBeVisible();
  await expect(page.getByText("Credential request detected")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Run AI Council" })).toBeDisabled();
});

test("editing clears an old verdict and council output", async ({ page }) => {
  await page.goto("/");
  const input = page.getByPlaceholder("Paste a suspicious message or URL...");
  await input.fill("URGENT: send your OTP immediately.");
  await page.getByRole("button", { name: "Run Cyber Team", exact: true }).click();
  await expect(page.getByText("BLOCK", { exact: true })).toBeVisible();
  await input.fill("Hello friend.");
  await expect(page.getByRole("region", { name: "Investigation result" })).toHaveCount(0);
});

test("all links are checked and threat strings render as text", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Paste a suspicious message or URL...").fill("https://safe.example then https://bank.example@evil.example <img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "Run Cyber Team", exact: true }).click();
  await expect(page.getByText("URL user-info detected")).toBeVisible();
  await expect(page.locator("img[src=x]")).toHaveCount(0);
});

test("API rejects bad inputs and sets privacy and framing headers", async ({ request }) => {
  const malformed = await request.post("/api/investigate", { headers: { "Content-Type": "application/json" }, data: "{" });
  expect(malformed.status()).toBe(400);
  const crossOrigin = await request.post("/api/investigate", { headers: { Origin: "https://evil.test" }, data: { input: "hello" } });
  expect(crossOrigin.status()).toBe(403);
  const oversized = await request.post("/api/investigate", { data: { input: "a".repeat(20001) } });
  expect(oversized.status()).toBe(413);
  const normal = await request.post("/api/investigate", { data: { input: "hello" } });
  expect(normal.status()).toBe(200);
  expect(normal.headers()["cache-control"]).toBe("no-store");
  expect(normal.headers()["x-frame-options"]).toBe("DENY");
  expect((await normal.json()).persisted).toBe(false);
});

test("optional provider failure leaves local verdict usable", async ({ page }) => {
  await page.route("https://js.puter.com/**", route => route.abort());
  await page.goto("/");
  await page.getByPlaceholder("Paste a suspicious message or URL...").fill("Hello friend.");
  await page.getByRole("button", { name: "Run Cyber Team", exact: true }).click();
  await expect(page.getByText("SAFE", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: /I agree to send this case/ }).check();
  await page.getByRole("button", { name: "Run AI Council" }).click();
  await expect(page.getByText("AI provider unavailable.")).toBeVisible();
  await expect(page.getByText("SAFE", { exact: true })).toBeVisible();
});
