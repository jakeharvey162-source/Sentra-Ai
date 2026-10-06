import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const compiled = mkdtempSync(join(tmpdir(), 'sentra-security-'));
let passed = 0;
try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--module', 'commonjs', '--moduleResolution', 'node', '--target', 'ES2022', '--skipLibCheck', '--outDir', compiled, 'lib/security/orchestrator.ts', 'lib/security/request.ts'], { stdio: 'inherit' });
  const require = createRequire(import.meta.url);
  const { investigateText } = require(join(compiled, 'orchestrator.js'));
  const { matchesThreatDomain, extractUrls } = require(join(compiled, 'urls.js'));
  const { readInvestigationInput, allowInvestigation } = require(join(compiled, 'request.js'));
  const { runCyberJury, runChallenger } = require(join(compiled, 'review.js'));
  const { calculateRiskScore } = require(join(compiled, 'scoring.js'));
  const { loadActivePhishingDomains } = require(join(compiled, 'free-threat-intel.js'));
  let fetches = 0;
  globalThis.fetch = async url => {
    assert.equal(String(url), 'https://raw.githubusercontent.com/Phishing-Database/Phishing.Database/master/phishing-domains-ACTIVE.txt', 'Never fetch submitted destinations');
    fetches++;
    return new Response('# fixture\nbad.example\nphishing.example\n', { status: 200 });
  };
  async function check(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }
  await check('threat feed exact, subdomain, case and trailing dot; suffix spoof rejected', () => {
    const domains = new Set(['bad.example']);
    for (const host of ['bad.example', 'a.bad.example', 'A.BAD.EXAMPLE.']) assert.equal(matchesThreatDomain(host, domains), true);
    for (const host of ['notbad.example', 'bad.example.safe.test']) assert.equal(matchesThreatDomain(host, domains), false);
  });
  await check('concurrent feed fetches share one request', async () => {
    await Promise.all(Array.from({ length: 10 }, () => loadActivePhishingDomains()));
    assert.equal(fetches, 1);
  });
  await check('later malicious URL cannot hide behind harmless first link', async () => {
    const r = await investigateText('See https://safe.example then https://login.bad.example/');
    assert.equal(r.investigation.decision, 'BLOCK');
    assert.ok(r.investigation.evidence.some(e => e.title === 'Known active phishing domain'));
  });
  await check('later deceptive link and punycode label are detected', async () => {
    const r = await investigateText('https://safe.example https://bank.example@evil.example https://www.xn--pypal-4ve.example');
    assert.ok(r.investigation.evidence.some(e => e.title === 'URL user-info detected'));
    assert.ok(r.investigation.evidence.some(e => e.title === 'Punycode domain detected'));
    assert.equal(new Set(r.investigation.evidence.map(e => e.id)).size, r.investigation.evidence.length);
  });
  for (const input of ['Never share your password or OTP with anyone.', 'Do not send your PIN.', 'We will never ask for your password.', 'Spinning a story about an urgent payment is not a credential request.', 'Hi, see you tomorrow.']) {
    await check(`no credential false positive: ${input}`, async () => {
      const r = await investigateText(input);
      assert.ok(!r.investigation.evidence.some(e => e.id === 'phish-credentials'));
      assert.ok(!r.scamDNA.traits.includes("credential-request"));
    });
  }
  for (const input of ['URGENT: account locked. Send your password immediately.', 'Never share your OTP. Now send your verification code to me.', 'Send your p\u200Bassword now.', 'Never share your OTP but send me your password now.']) {
    await check(`credential theft detected: ${input}`, async () => {
      assert.equal((await investigateText(input)).investigation.decision, 'BLOCK');
    });
  }
  for (const input of ['Please send me your one-time code.', 'Give me your 2FA code.', 'Provide your MFA code.', 'Share your authentication code.', 'Send your one‑time passcode.', 'Give me your password reset code.', 'Send your pa\u2060ssword now.', 'Send your pa\u00ADssword now.']) {
    await check(`authentication alias or invisible-character request detected: ${input}`, async () => {
      const result = await investigateText(input);
      assert.equal(result.investigation.decision, 'BLOCK');
      assert.ok(result.scamDNA.traits.includes('credential-request'));
    });
  }
  for (const input of ['Never share your one-time code with anyone.', 'Do not send your 2FA code.', 'We will never ask for your authentication code.', 'Please send your postal code.', 'Share your project code with your team.']) {
    await check(`alias safety advice and ordinary codes do not become theft: ${input}`, async () => {
      const result = await investigateText(input);
      assert.equal(result.investigation.decision, 'SAFE');
      assert.ok(!result.scamDNA.traits.includes('credential-request'));
    });
  }
  await check('Challenger and majority cannot override strong evidence', () => {
    const empty = { recommendation: 'SAFE', evidence: [] };
    assert.equal(runChallenger([empty], 'HOLD').adjustedDecision, 'HOLD');
    assert.equal(runCyberJury([empty, empty], 'BLOCK').decision, 'BLOCK');
  });
  await check('coverage gaps cannot dilute scores', () => {
    const evidence = [{ severity: 'critical', confidence: .96, weight: 1 }];
    assert.equal(calculateRiskScore([...evidence, { severity: 'info', confidence: 0, weight: 0 }]), calculateRiskScore(evidence));
  });
  await check('case IDs are unique across concurrent requests', async () => {
    const cases = await Promise.all(Array.from({ length: 50 }, () => investigateText('hello')));
    assert.equal(new Set(cases.map(r => r.investigation.id)).size, 50);
  });
  const request = (body, headers = {}) => new Request('https://sentra.test/api/investigate', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });
  for (const [name, req, status] of [
    ['malformed JSON', request('{'), 400],
    ['missing input', request('{}'), 400],
    ['array input', request('{"input":[]}'), 400],
    ['oversized input', request(JSON.stringify({input:'a'.repeat(20001)})), 413],
    ['oversized body', request(JSON.stringify({input:'ok', padding:'a'.repeat(100001)})), 413],
    ['cross-origin request', request('{"input":"hi"}', {origin:'https://evil.test'}), 403],
    ['wrong content type', request('{"input":"hi"}', {'content-type':'text/plain'}), 415],
    ['excess links', request(JSON.stringify({input:Array.from({length:21}, (_,i) => `https://${i}.example`).join(' ')})), 413],
  ]) await check(`API rejects ${name}`, async () => { await assert.rejects(readInvestigationInput(req), error => error.status === status); });
  await check('save is explicit opt-in; same-origin request accepted', async () => {
    assert.deepEqual(await readInvestigationInput(request('{"input":" hi "}', {origin:'https://sentra.test'})), {input:'hi',saveCase:false});
    assert.equal((await readInvestigationInput(request('{"input":"hi","saveCase":"true"}'))).saveCase, false);
    assert.equal((await readInvestigationInput(request('{"input":"hi","saveCase":true}'))).saveCase, true);
    const proxied = new Request('http://localhost:3000/api/investigate', {method:'POST',headers:{'content-type':'application/json',host:'127.0.0.1:3000',origin:'http://127.0.0.1:3000'},body:'{"input":"hello"}'});
    assert.equal((await readInvestigationInput(proxied)).input, 'hello');
  });
  await check('rate limit and reset', () => {
    for (let i = 0; i < 30; i++) assert.equal(allowInvestigation('fixture', 1), true);
    assert.equal(allowInvestigation('fixture', 1), false);
    assert.equal(allowInvestigation('fixture', 60002), true);
  });
  await check('extract URLs trims prose punctuation and preserves user-info', () => {
    assert.deepEqual(extractUrls('https://a.example, https://a.example https://a.example@b.example).'), ['https://a.example', 'https://a.example@b.example']);
  });
  // Reload the module in isolation to test feed failure rather than the cached fixture.
  delete require.cache[require.resolve(join(compiled, 'free-threat-intel.js'))];
  const failedFeed = require(join(compiled, 'free-threat-intel.js'));
  globalThis.fetch = async () => { throw new Error('network offline'); };
  await check('failed feed is a visible coverage gap, never a clean result', async () => {
    const evidence = await failedFeed.checkFreePhishingFeed('https://example.test');
    assert.equal(evidence[0].title, 'Threat intelligence unavailable');
    assert.equal(evidence[0].weight, 0);
  });
  await check('current-sized 11MB community feed fits the bounded reader', async () => {
    delete require.cache[require.resolve(join(compiled, 'free-threat-intel.js'))];
    const feed = require(join(compiled, 'free-threat-intel.js'));
    globalThis.fetch = async () => new Response('bad.example\n' + ('# fixture padding\n').repeat(650000));
    const domains = await feed.loadActivePhishingDomains();
    assert.ok(domains?.has('bad.example'));
  });
  await check('oversized community feed is rejected without a partial clean result', async () => {
    delete require.cache[require.resolve(join(compiled, 'free-threat-intel.js'))];
    const feed = require(join(compiled, 'free-threat-intel.js'));
    globalThis.fetch = async () => new Response('bad.example\n' + '#'.repeat(17 * 1024 * 1024));
    assert.equal(await feed.loadActivePhishingDomains(), null);
    assert.equal((await feed.checkFreePhishingFeed('https://example.test'))[0].title, 'Threat intelligence unavailable');
  });
  console.log(`${passed} security regression checks passed against compiled implementation.`);
} finally { rmSync(compiled, { recursive: true, force: true }); }
