import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
async function freePort(){return new Promise((resolve,reject)=>{const srv=net.createServer();srv.once('error',reject);srv.listen(0,'127.0.0.1',()=>{const p=srv.address().port;srv.close(()=>resolve(p))})})}
test('API quyền truy cập, dữ liệu nháp, công bố, nguồn, xuất dữ liệu',async()=>{
 const port=await freePort(), password='integration-only-secret-long';
 const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),HOST:'127.0.0.1',ADMIN_PASSWORD:password,GEMINI_API_KEY:''},stdio:'pipe'});
 let logs='';child.stderr.on('data',d=>logs+=d.toString());
 const base='http://127.0.0.1:'+port;
 async function req(path,method='GET',body,auth=false){
  const r=await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',...(auth?{'x-admin-password':password}:{})},body:body?JSON.stringify(body):undefined});
  return {status:r.status,body:await r.json()};
 }
 try{
  let ready=false;for(let i=0;i<75;i++){if(child.exitCode!==null)break;try{const r=await fetch(base+'/api/public');if(r.ok){ready=true;break}}catch{}await delay(60)}
  assert.ok(ready,'Server must start. '+logs);
  const publicBefore=await req('/public');assert.equal(publicBefore.status,200);
  const denied=await req('/admin');assert.equal(denied.status,401);
  const login=await req('/login','POST',{},true);assert.equal(login.status,200);
  const created=await req('/records','POST',{identifier:'TEST-'+Date.now(),title:'Tư liệu thử nội bộ',description:'Chỉ dùng cho thử API',status:'draft'},true);assert.equal(created.status,200);
  const list=await req('/public');assert.ok(!list.body.records.some(r=>r.id===created.body.id),'A draft must never be public');
  const invalid=await req('/records/'+created.body.id,'PUT',{status:'published',permissionConfirmed:true},true);assert.equal(invalid.status,400);
  const deleted=await req('/records/'+created.body.id,'DELETE',null,true);assert.equal(deleted.status,200);
  const result=await req('/export','GET',null,true);assert.equal(result.status,200);
  console.log('All integration assertions passed');
 }finally{child.kill('SIGTERM');await delay(120)}
});
