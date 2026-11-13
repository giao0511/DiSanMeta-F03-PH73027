import http from 'node:http';
import fs from 'node:fs/promises';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const WEB=path.join(ROOT,'public');
const DATA=path.join(ROOT,'data');
const UPLOADS=path.join(ROOT,'uploads');
for(const folder of [DATA,UPLOADS])await fs.mkdir(folder,{recursive:true});
for(const line of (existsSync(path.join(ROOT,'.env'))?readFileSync(path.join(ROOT,'.env'),'utf8'):'').split(/\r?\n/)){
 const m=line.match(/^([A-Z0-9_]+)=(.*)$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2];
}
const ADMIN=process.env.ADMIN_PASSWORD||'';
const APIKEY=process.env.GEMINI_API_KEY||'';
const MODEL=process.env.GEMINI_MODEL||'gemini-2.5-flash';
const HOST=process.env.HOST||'127.0.0.1', PORT=Number(process.env.PORT||3000);
if(!ADMIN || ADMIN==='thay_bang_mat_khau_rat_manh'){console.error('Set a strong ADMIN_PASSWORD in .env or environment');process.exit(1)}
const initial={settings:{collection:'',holder:'',location:'',license:'',student:'Trần Trung Hiếu',msv:'PH73027',group:'Nhóm 1'},sources:[],records:[]};
const storeFile=path.join(DATA,'store.json');
let db;
try {db=JSON.parse(await fs.readFile(storeFile,'utf8'))}catch{db=structuredClone(initial)}
async function save(){const t=storeFile+'.tmp';await fs.writeFile(t,JSON.stringify(db,null,2));await fs.rename(t,storeFile)}
const json=(res,status,obj)=>{const out=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(out)};
const safe=(r)=>{const {internalNotes,privateInfo,...rest}=r;return rest};
const approved=r=>r.status==='published'&&r.permissionConfirmed===true&&r.permissionPerson&&r.permissionScope;
const pub=()=>({settings:db.settings,sources:db.sources,records:db.records.filter(approved).map(safe)});
const unauth=()=>({error:'Cần xác thực quản trị'});
const authorized=req=>{const v=req.headers['x-admin-password']||'';if(!ADMIN||typeof v!=='string')return false;const a=Buffer.from(v),b=Buffer.from(ADMIN);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const readBody=async req=>{const parts=[];let n=0;for await(const x of req){n+=x.length;if(n>8_000_000)throw Error('Dữ liệu quá lớn');parts.push(x)}return JSON.parse(Buffer.concat(parts).toString('utf8')||'{}')};
const allowedMime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon'};
const cleanText=(v,max=10000)=>String(v??'').slice(0,max);
const ensureFields=record=>{
 const required=['title','creator','subject','description','publisher','contributor','date','type','format','identifier','source','language','relation','coverage','rights','currentLocation','historicalLocation','copyType','originalCondition','registrationNumber','permissionPerson','permissionScope','excludedContent','verification'];
 const missing=required.filter(k=>!cleanText(record[k]).trim());
 return missing;
};
const validateRecord=rec=>{
 if(!rec||typeof rec!=='object'||Array.isArray(rec))throw Error('Bản ghi không hợp lệ');
 const record={};for(const [k,v] of Object.entries(rec)){if(['__proto__','constructor','prototype'].includes(k))continue;record[k]=typeof v==='string'?v.slice(0,12000):v}
 record.id=cleanText(record.id,120)||crypto.randomUUID();
 record.status=record.status==='published'?'published':'draft';
 record.permissionConfirmed=record.permissionConfirmed===true;
 record.updatedAt=new Date().toISOString();
 if(record.status==='published'){
  const missing=ensureFields(record);
  if(missing.length)throw Error('Thiếu trường: '+missing.join(', '));
  if(!record.permissionConfirmed)throw Error('Chưa xác nhận quyền công bố');
  if(!record.imageSource && record.imageUrl)throw Error('Ảnh phải có nguồn');
 }
 return record;
};
const GEMINI_INSTRUCTION='Bạn là trợ lý DiSanMeta. Chỉ sử dụng dữ liệu trong JSON được cung cấp, không tự bịa thông tin. Mỗi đáp án thực tế phải kèm mã bản ghi, nơi lưu giữ và loại bản. Nếu không tìm thấy, nói rõ: Chưa có tư liệu để trả lời. Trả lời tiếng Việt, ngắn gọn.';
async function askGemini(question){
 if(!APIKEY)throw Error('Chưa cấu hình GEMINI_API_KEY ở máy chủ');
 const records=pub().records.map(({id,title,identifier,description,currentLocation,copyType,verification,source})=>({id,title,identifier,description,currentLocation,copyType,verification,source})).slice(0,200);
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(MODEL)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':APIKEY},body:JSON.stringify({systemInstruction:{parts:[{text:GEMINI_INSTRUCTION}]},contents:[{role:'user',parts:[{text:'DỮ LIỆU:\n'+JSON.stringify(records)+'\nCÂU HỎI: '+cleanText(question,600)}]}],generationConfig:{temperature:0.1,maxOutputTokens:800}})});
 const result=await response.json();if(!response.ok)throw Error(result.error?.message||'Gemini lỗi');
 return result.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'Không có phản hồi';
}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');const p=url.pathname;const method=req.method;
  if(p.startsWith('/api/')){
   if(p==='/api/public'&&method==='GET')return json(res,200,pub());
   if(p==='/api/login'&&method==='POST')return json(res,authorized(req)?200:401,{ok:authorized(req)});
   if(p==='/api/ai'&&method==='POST'){const {question}=await readBody(req);if(!question)return json(res,400,{error:'Cần câu hỏi'});return json(res,200,{answer:await askGemini(question)})}
   if(!authorized(req))return json(res,401,unauth());
   if(p==='/api/admin'&&method==='GET')return json(res,200,db);
   if(p==='/api/settings'&&method==='PUT'){db.settings={...db.settings,...await readBody(req)};await save();return json(res,200,{ok:true})}
   if(p==='/api/sources'&&method==='POST'){const item=await readBody(req);item.id=crypto.randomUUID();db.sources.push(item);await save();return json(res,200,item)}
   if(p.startsWith('/api/sources/')&&method==='DELETE'){db.sources=db.sources.filter(s=>s.id!==p.split('/').pop());await save();return json(res,200,{ok:true})}
   if(p==='/api/records'&&method==='POST'){const record=validateRecord(await readBody(req));db.records.push(record);await save();return json(res,200,record)}
   if(p.startsWith('/api/records/')&&method==='PUT'){const id=p.split('/').pop(),i=db.records.findIndex(r=>r.id===id);if(i<0)return json(res,404,{error:'Không tìm thấy'});const record=validateRecord({...db.records[i],...await readBody(req),id});db.records[i]=record;await save();return json(res,200,record)}
   if(p.startsWith('/api/records/')&&method==='DELETE'){db.records=db.records.filter(r=>r.id!==p.split('/').pop());await save();return json(res,200,{ok:true})}
   if(p==='/api/export'&&method==='GET')return json(res,200,db);
   return json(res,404,{error:'Không có API'});
  }
  if(method!=='GET'&&method!=='HEAD'){res.writeHead(405);return res.end()}
  let wanted=p==='/'?'/index.html':decodeURIComponent(p);
  if(wanted.includes('..')||wanted.includes('\\')||wanted.startsWith('/.')){res.writeHead(403);return res.end()}
  let file=path.resolve(WEB,'.'+wanted);if(!file.startsWith(WEB+path.sep)){res.writeHead(403);return res.end()}
  let body;try{body=await fs.readFile(file)}catch{res.writeHead(404);return res.end('Not found')}
  res.writeHead(200,{'Content-Type':allowedMime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; connect-src 'self'; img-src 'self' data: https:; style-src 'self'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'"});return res.end(method==='HEAD'?undefined:body);
 }catch(e){return json(res,400,{error:String(e?.message||e)})}
});
server.listen(PORT,HOST,()=>console.log('DiSanMeta: http://'+HOST+':'+PORT));
