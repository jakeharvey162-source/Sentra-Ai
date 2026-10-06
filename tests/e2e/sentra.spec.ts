import { test, expect } from "@playwright/test";

test("home page loads and core navigation is visible", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Sentra AI/);
  await expect(page.getByText("Security is mostly")).toBeVisible();
  await expect(page.getByRole("button", { name: /Run Cyber Team/i })).toBeDisabled();
  await expect(page.locator("#protect").getByText("protect my app", { exact: true })).toBeVisible();
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

test("connections require sign-in and do not advertise unconfigured OAuth", async ({ page }) => {
  await page.goto("/connections");
  await expect(page.getByRole("heading", { name: "Catch threats where they arrive." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in to connect your accounts" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect Gmail", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Scan recent messages", exact: true })).toBeDisabled();
});

test("connected scan consent, stale-result clearing and disconnect work with fixtures", async ({ page }) => {
  let disconnected = false;
  const posts: Record<string, unknown>[] = [];
  await page.route("**/api/connections", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { platforms: [{id:"gmail",ready:true},{id:"slack",ready:false},{id:"outlook",ready:false}], accounts: disconnected ? [] : [{id:"ca_fixture",provider:"gmail",status:"ACTIVE"}] } });
    const body = route.request().postDataJSON(); posts.push(body);
    if (body.action === "disconnect") { disconnected = true; return route.fulfill({json:{disconnected:true}}); }
    return route.fulfill({json:{scanned:1,checkedAt:new Date().toISOString(),coverage:"Fixture: latest messages only.",findings:[{id:"msg1",title:"<img src=x onerror=alert(1)>",sender:"scammer@example.com",decision:"BLOCK",score:90,explanation:"Credential pressure detected.",incomplete:false,evidence:[{title:"Credential request detected",detail:"Message asks for credentials.",severity:"high"}]}]}});
  });
  await page.goto("/connections");
  await page.getByRole("combobox", { name: "Account to scan" }).selectOption("ca_fixture");
  const scan=page.getByRole("button",{name:"Scan recent messages",exact:true});
  await expect(scan).toBeDisabled();
  await page.getByRole("checkbox", {name:/I agree to connect through Composio/}).check();
  await scan.click();
  await expect(page.getByText("BLOCK · 90/100",{exact:true})).toBeVisible();
  await expect(page.locator("img[src=x]")).toHaveCount(0);
  expect(posts[0]).toEqual({action:"scan",accountId:"ca_fixture",channel:"",consent:true});
  await page.getByRole("checkbox", {name:/I agree to connect through Composio/}).uncheck();
  await expect(page.getByRole("region",{name:"Connected scan results"})).toHaveCount(0);
  await page.getByRole("button", {name:"Disconnect",exact:true}).click();
  await expect(page.getByText("No connected accounts yet.")).toBeVisible();
  expect(posts[1]).toEqual({action:"disconnect",accountId:"ca_fixture"});
});

test('case history requires sign-in and privacy is reachable', async ({ page }) => {
  await page.goto('/cases');
  await expect(page.getByRole('heading',{name:'Your saved investigations'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Sign in to view your saved cases'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Delete all saved cases'})).toHaveCount(0);
  await page.getByRole('link',{name:'How Sentra handles your data'}).click();
  await expect(page.getByRole('heading',{name:'Your data and Sentra’s limits'})).toBeVisible();
  await expect(page.getByText(/Saved cases remain until you delete them/)).toBeVisible();
});

test('owned history evidence, pagination and deliberate deletion work with fixtures', async ({ page }) => {
  const saved={id:'b20fcbda-75ac-4c24-8a2e-3d0e12e30a11',case_ref:'S-FIXTURE',kind:'message',input_preview:'<img src=x onerror=alert(1)>',risk_score:90,decision:'BLOCK',explanation:'Fixture: credential pressure detected.',created_at:'2026-10-06T10:00:00Z'};
  let removed=false;const posts:Record<string,unknown>[]=[];
  await page.route('**/api/cases*', async route=>{
    if(route.request().method()==='POST') {const body=route.request().postDataJSON();posts.push(body);if(body.action==='delete'||body.action==='deleteAll')removed=true;return route.fulfill({json:{deleted:true,signedOut:body.action==='signOut'}});}
    const url=new URL(route.request().url());
    if(url.searchParams.has('id')) return route.fulfill({json:{case:saved,evidence:[{id:'e1',title:'Credential request detected',detail:'<script>alert(1)</script>',severity:'high'}]}});
    return route.fulfill({json:{cases:removed?[]:[saved],page:Number(url.searchParams.get('page')||0),hasMore:!removed&&url.searchParams.get('page')==='0',email:'fixture@example.invalid'}});
  });
  await page.goto('/cases');
  await expect(page.getByText('fixture@example.invalid')).toBeVisible();
  await expect(page.locator('img[src=x]')).toHaveCount(0);
  await page.getByRole('button',{name:'View evidence for S-FIXTURE'}).click();
  await expect(page.getByRole('region',{name:'Saved case evidence'})).toBeVisible();
  await expect(page.getByText('<script>alert(1)</script>',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Older cases'}).click();
  await expect(page.getByText('Page 2',{exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'Saved case evidence'})).toHaveCount(0);
  await page.getByRole('button',{name:'Delete S-FIXTURE',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  expect(posts).toEqual([]);
  await page.getByRole('button',{name:'Delete S-FIXTURE',exact:true}).click();
  await page.getByRole('button',{name:'Confirm deletion',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Saved case and its evidence were deleted.');
  await expect(page.getByText(/No saved cases on this page/)).toBeVisible();
  expect(posts).toEqual([{action:'delete',id:saved.id}]);
  await page.getByRole('button',{name:'Sign out of this session'}).click();
  await expect(page).toHaveURL(/\/$/);
  expect(posts[1]).toEqual({action:'signOut'});
});

test('bulk deletion requires explicit phrase; failure keeps saved cases', async ({ page }) => {
  const saved={id:'b20fcbda-75ac-4c24-8a2e-3d0e12e30a11',case_ref:'S-BULK',kind:'message',input_preview:'fixture',risk_score:0,decision:'SAFE',explanation:'fixture',created_at:'2026-10-06T10:00:00Z'};
  const posts:Record<string,unknown>[]=[];
  await page.route('**/api/cases*',async route=>{
    if(route.request().method()==='POST'){posts.push(route.request().postDataJSON());return route.fulfill({status:503,json:{error:'Cases could not be deleted. Please try again.'}});}
    return route.fulfill({json:{cases:[saved],page:0,hasMore:false,email:'fixture@example.invalid'}});
  });
  await page.goto('/cases');
  await page.getByRole('button',{name:'Delete all saved cases',exact:true}).click();
  const confirm=page.getByRole('button',{name:'Confirm deletion',exact:true});
  await expect(confirm).toBeDisabled();
  await page.getByRole('textbox',{name:'Deletion confirmation'}).fill('DELETE ALL SAVED CASES');
  await confirm.click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Cases could not be deleted. Please try again.');
  await expect(page.getByRole('button',{name:'View evidence for S-BULK'})).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(posts).toEqual([{action:'deleteAll',confirmation:'DELETE ALL SAVED CASES'}]);
});

test('expired history session clears previously visible private data',async({page})=>{
  const saved={id:'b20fcbda-75ac-4c24-8a2e-3d0e12e30a11',case_ref:'S-PRIVATE',kind:'message',input_preview:'PRIVATE PREVIEW',risk_score:0,decision:'SAFE',explanation:'fixture',created_at:'2026-10-06T10:00:00Z'};
  let first=true;
  await page.route('**/api/cases*',async route=>{if(first){first=false;return route.fulfill({json:{cases:[saved],page:0,hasMore:false,email:'fixture@example.invalid'}});}return route.fulfill({status:401,json:{error:'Sign in to manage your saved cases.'}});});
  await page.goto('/cases');
  await expect(page.getByText('Saved preview: PRIVATE PREVIEW')).toBeVisible();
  await page.getByRole('button',{name:'Refresh history'}).click();
  await expect(page.getByRole('heading',{name:'Sign in to view your saved cases'})).toBeVisible();
  await expect(page.getByText('Saved preview: PRIVATE PREVIEW')).toHaveCount(0);
  await expect(page.getByText('fixture@example.invalid')).toHaveCount(0);
});

test('verdicts lead to practical safer actions without opening submitted links',async({page})=>{
 await page.goto('/');
 await page.getByPlaceholder('Paste a suspicious message or URL...').fill('URGENT: send your password immediately. https://bank.example@evil.example');
 await page.getByRole('button',{name:'Run Cyber Team',exact:true}).click();
 const steps=page.getByRole('region',{name:'Safer next steps'});
 await expect(steps).toBeVisible();
 await expect(steps.getByText(/Pause. Do not reply/)).toBeVisible();
 await expect(steps.getByText(/official app/)).toBeVisible();
 await expect(page.locator('a[href*="evil.example"]')).toHaveCount(0);
});


test('authentication-code aliases are detected while safety advice stays clear',async({page})=>{
 await page.goto('/');
 const input=page.getByPlaceholder('Paste a suspicious message or URL...');
 const run=page.getByRole('button',{name:'Run Cyber Team',exact:true});
 await input.fill('Please send me your one-time code.'); await run.click();
 await expect(page.getByText('BLOCK',{exact:true})).toBeVisible();
 await expect(page.getByText('Credential request detected',{exact:true})).toBeVisible();
 await input.fill('Never share your one-time code with anyone.'); await run.click();
 await expect(page.getByText('SAFE',{exact:true})).toBeVisible();
 await expect(page.getByText('Credential request detected',{exact:true})).toHaveCount(0);
});
