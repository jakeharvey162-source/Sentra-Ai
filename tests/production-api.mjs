import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3009'], {stdio: ['ignore','pipe','pipe']});
let output = '';
server.stdout.on('data', b => output += b);
server.stderr.on('data', b => output += b);
const base = 'http://127.0.0.1:3009';
try {
  let ready = false;
  for (let i=0; i<100; i++) {
    try { ready = (await fetch(base)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, output);
  let connection=await fetch(base+'/api/connections');assert.equal(connection.status,401);assert.equal(connection.headers.get('cache-control'),'no-store');
  connection=await fetch(base+'/api/connections',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(connection.status,403);
  connection=await fetch(base+'/api/connections',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({action:'scan',accountId:'other',consent:true})});assert.equal(connection.status,401);
  connection=await fetch(base+'/api/connections',{method:'POST',headers:{'content-type':'application/json',origin:base},body:'a'.repeat(5000)});assert.equal(connection.status,413);
  const callback=await fetch(base+'/api/connections/callback?session_uri=forged',{redirect:'manual'});assert.equal(callback.status,303);assert.equal(callback.headers.get('location'),'https://sentra-ai-7lij.vercel.app/connections?connection=failed');assert.ok(!callback.headers.get('location').includes('forged'));
  const post=(body,headers={})=>fetch(base+'/api/investigate',{method:'POST',headers:{'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
  let r=await post('{');assert.equal(r.status,400);
  r=await post({input:'hello'},{origin:'https://evil.test'});assert.equal(r.status,403);
  r=await post({input:'a'.repeat(20001)});assert.equal(r.status,413);
  r=await post({input:'hello'},{'content-type':'text/plain'});assert.equal(r.status,415);
  r=await post({input:'Never share your password or OTP with anyone.'},{origin:base});assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('x-frame-options'),'DENY');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal((await r.json()).investigation.decision,'SAFE');
  r=await post({input:'URGENT: send your password immediately.'});const phishing=await r.json();assert.equal(phishing.investigation.decision,'BLOCK');assert.equal(phishing.persisted,false);
  r=await post({input:'https://safe.example https://bank.example@evil.example'});const urls=await r.json();assert.ok(urls.investigation.evidence.some(x=>x.title==='URL user-info detected'));assert.equal(urls.investigation.decision,'BLOCK');
  for(let i=0;i<28;i++)r=await post({input:'hello'});
  assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'60');
  console.log('Production HTTP checks passed: malformed/type/size/origin rejection, anti-framing and privacy headers, safety advice, phishing, second-link deception, anonymous persistence, rate limit.');
} finally { server.kill('SIGTERM'); }
