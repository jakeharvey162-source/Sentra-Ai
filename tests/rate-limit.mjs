import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const dir = mkdtempSync(join(tmpdir(), 'sentra-rate-'));
try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc','--module','commonjs','--moduleResolution','node','--target','ES2022','--skipLibCheck','--outDir',dir,'lib/server/rate-limit.ts'], {stdio:'inherit'});
  const { enforceRateLimit } = createRequire(import.meta.url)(join(dir,'server/rate-limit.js'));
  process.env.VERCEL='1'; delete process.env.SENTRA_SERVER_SECRET;
  await assert.rejects(enforceRateLimit('investigate','fixture'), e=>e.status===503);
  process.env.SENTRA_SERVER_SECRET='a'.repeat(64);
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.supabase.co';
  let calls=[];
  global.fetch=async(url,opts)=>{ calls.push({url,opts});return Response.json({allowed:true,retryAfter:60}); };
  await enforceRateLimit('investigate','192.0.2.1'); await enforceRateLimit('investigate','192.0.2.1');
  assert.equal(calls.length,2);
  const a=JSON.parse(calls[0].opts.body), b=JSON.parse(calls[1].opts.body);
  assert.equal(a.p_key,b.p_key); assert.match(a.p_key,/^[a-f0-9]{64}$/); assert.ok(!calls[0].opts.body.includes('192.0.2.1'));
  assert.equal(calls[0].url,'https://fixture.supabase.co/rest/v1/rpc/sentra_rate_limit'); assert.equal(calls[0].opts.redirect,'error');
  global.fetch=async()=>Response.json({allowed:false,retryAfter:12});
  await assert.rejects(enforceRateLimit('connect','fixture'),e=>e.status===429);
  for(const response of [new Response('private upstream detail',{status:500}),Response.json({allowed:true,retryAfter:0})]){
    global.fetch=async()=>response;
    await assert.rejects(enforceRateLimit('investigate','fixture'),e=>e.status===503&&!e.message.includes('private'));
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://attacker.example'; global.fetch=()=>{throw Error('Must not fetch');};
  await assert.rejects(enforceRateLimit('investigate','fixture'),e=>e.status===503);
  console.log('PASS: 6 distributed rate-limit security checks');
} finally { rmSync(dir,{recursive:true,force:true}); }
