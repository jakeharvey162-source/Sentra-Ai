import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const dir=mkdtempSync(join(tmpdir(),'sentra-cases-'));let passed=0;
const origin='https://sentra-ai-7lij.vercel.app';const id='b20fcbda-75ac-4c24-8a2e-3d0e12e30a11';
try{
 execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--module','commonjs','--moduleResolution','node','--target','ES2022','--skipLibCheck','--outDir',dir,'lib/cases/service.ts'],{stdio:'inherit'});
 const {caseRequest}=createRequire(import.meta.url)(join(dir,'cases/service.js'));
 let user={id:'verified-owner',email:'fixture@example.invalid'},authError=null,dbError=null,signOutError=null,authCalls=0,rows=[],exists=true,queries=[],signOutScopes=[];
 const client={auth:{getUser:async()=>{authCalls++;return{data:{user},error:authError}},signOut:async options=>{signOutScopes.push(options);return{error:signOutError}}},from(table){const q={table,filters:[],orders:[],op:'select'};queries.push(q);
  const builder={select(c){q.columns=c;return this},delete(){q.op='delete';return this},eq(k,v){q.filters.push([k,v]);return this},order(k,o){q.orders.push([k,o]);return this},range(a,b){q.range=[a,b];return this},limit(n){q.limit=n;return this},maybeSingle(){q.single=true;return this},then(resolve,reject){assert.ok(q.filters.some(([k,v])=>k==='user_id'&&v==='verified-owner'),'Missing verified owner filter');return Promise.resolve({data:q.single?(exists?{id}:null):rows,error:dbError}).then(resolve,reject)}};return builder}};
 const get=(path='')=>new Request(origin+'/api/cases'+path);
 const post=(body,headers={})=>new Request(origin+'/api/cases',{method:'POST',headers:{'content-type':'application/json',origin,...headers},body:typeof body==='string'?body:JSON.stringify(body)});
 async function test(name,fn){queries=[];authCalls=0;await fn();passed++;console.log('PASS '+name)}
 await test('anonymous and anonymous-auth users cannot read history',async()=>{const saved=user;for(const u of [null,{...saved,is_anonymous:true}]){user=u;await assert.rejects(caseRequest(get(),client),e=>e.status===401);assert.equal(queries.length,0)}user=saved});
 await test('forged/missing Origin rejected before auth or writes',async()=>{for(const o of ['https://evil.example',''])await assert.rejects(caseRequest(post({action:'delete',id},{origin:o}),client),e=>e.status===403);assert.equal(authCalls,0);assert.equal(queries.length,0)});
 await test('bounded malformed bodies reject before database access',async()=>{await assert.rejects(caseRequest(post('{'),client),e=>e.status===400);await assert.rejects(caseRequest(post('a'.repeat(1100)),client),e=>e.status===413);await assert.rejects(caseRequest(post([]),client),e=>e.status===400);assert.equal(queries.length,0)});
 await test('unknown actions and injected case filters rejected',async()=>{await assert.rejects(caseRequest(post({action:'execute'}),client),e=>e.status===400);await assert.rejects(caseRequest(post({action:'delete',id:'id.or.user_id.eq.victim'}),client),e=>e.status===400);await assert.rejects(caseRequest(get('?id=../../victim'),client),e=>e.status===400);assert.equal(queries.length,0)});
 await test('history bounded, deterministic and excludes owner/token data',async()=>{rows=Array.from({length:21},(_,n)=>({id:String(n)}));const r=await caseRequest(get('?page=2&user_id=victim'),client);assert.equal(r.cases.length,20);assert.equal(r.hasMore,true);assert.deepEqual(queries[0].range,[40,60]);assert.deepEqual(queries[0].orders.map(x=>x[0]),['created_at','id']);assert.ok(!queries[0].columns.includes('user_id'));assert.ok(!queries[0].columns.includes('*'));rows=[]});
 await test('negative, excessive and injected pages rejected',async()=>{for(const page of ['-1','10000','1.2','1,or(user_id.eq.victim)'])await assert.rejects(caseRequest(get('?page='+encodeURIComponent(page)),client),e=>e.status===400);assert.equal(queries.length,0)});
 await test('detail and evidence each use verified owner and requested ID',async()=>{const r=await caseRequest(get('?id='+id),client);assert.equal(r.case.id,id);assert.equal(queries.length,2);assert.ok(queries[0].filters.some(([k,v])=>k==='id'&&v===id));assert.ok(queries[1].filters.some(([k,v])=>k==='case_id'&&v===id));assert.equal(queries[1].limit,100)});
 await test('foreign/missing case reveals no evidence',async()=>{exists=false;await assert.rejects(caseRequest(get('?id='+id),client),e=>e.status===404);assert.equal(queries.length,1);exists=true});
 await test('single deletion ignores client owner and never deletes unfiltered',async()=>{const r=await caseRequest(post({action:'delete',id,user_id:'victim'}),client);assert.equal(r.deleted,true);assert.equal(queries[0].op,'delete');assert.equal(queries[0].filters.length,2)});
 await test('bulk deletion requires exact confirmation and filters owner',async()=>{await assert.rejects(caseRequest(post({action:'deleteAll',confirmation:true}),client),e=>e.status===400);assert.equal(queries.length,0);await caseRequest(post({action:'deleteAll',confirmation:'DELETE ALL SAVED CASES',user_id:'victim'}),client);assert.deepEqual(queries[0].filters,[['user_id','verified-owner']])});
 await test('database failures do not leak internals or claim success',async()=>{dbError={message:'private SQL internal'};for(const request of [get(),post({action:'delete',id})])await assert.rejects(caseRequest(request,client),e=>e.status===503&&!e.message.includes('private'));dbError=null});
 await test('sign-out is session-scoped and does not delete data',async()=>{const r=await caseRequest(post({action:'signOut'}),client);assert.equal(r.signedOut,true);assert.deepEqual(signOutScopes,[{scope:'local'}]);assert.equal(queries.length,0);signOutError={message:'private'};await assert.rejects(caseRequest(post({action:'signOut'}),client),e=>e.status===503);signOutError=null});
 console.log(`${passed} case-history security checks passed against compiled implementation; auth/database responses are fixtures.`);
}finally{rmSync(dir,{recursive:true,force:true})}
