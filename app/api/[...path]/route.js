import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, hash, verify, currentUser, startSession, safeUser, cookiePath } from '../../../lib/db';
import { jobs } from '../../../lib/jobs';
import { resumeCollections, parseExtra, cleanCollection, summarizeCollection } from '../../../lib/resume';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply=(data,status=200)=>NextResponse.json(data,{status});
export async function GET(req,{params}) { const {path}=await params; const user=await currentUser(); if(path[0]==='me') return reply({user:safeUser(user)}); if(path[0]==='applications') { if(!user) return reply({error:'ابتدا وارد حساب خود شوید.'},401); return reply({applications:db.prepare('SELECT * FROM applications WHERE user_id=? ORDER BY id DESC').all(user.id)}); } return reply({error:'یافت نشد'},404); }
export async function POST(req,{params}) { try { const {path}=await params; const action=path[0], body=await req.json(); if(action==='register') { const name=String(body.name||'').trim(),email=String(body.email||'').trim().toLowerCase(),password=String(body.password||''); if(!name||!/^\S+@\S+\.\S+$/.test(email)||password.length<8) return reply({error:'نام، ایمیل معتبر و رمز عبور حداقل ۸ نویسه‌ای را وارد کنید.'},400); if(db.prepare('SELECT id FROM users WHERE email=?').get(email)) return reply({error:'این ایمیل قبلاً ثبت شده است.'},409); const result=db.prepare('INSERT INTO users(name,email,password) VALUES (?,?,?)').run(name,email,hash(password)); await startSession(result.lastInsertRowid); return reply({user:safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid))}); }
if(action==='login') { const user=db.prepare('SELECT * FROM users WHERE email=?').get(String(body.email||'').trim().toLowerCase()); if(!user||!verify(String(body.password||''),user.password)) return reply({error:'ایمیل یا رمز عبور صحیح نیست.'},401); await startSession(user.id); return reply({user:safeUser(user)}); }
if(action==='logout') { const token=(await cookies()).get('session')?.value; if(token) db.prepare('DELETE FROM sessions WHERE token=?').run(token); (await cookies()).set('session','',{path:cookiePath,maxAge:0,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'}); return reply({ok:true}); }
const user=await currentUser(); if(!user) return reply({error:'ابتدا وارد حساب خود شوید.'},401);
if(action==='profile') {
 const fields=['name','phone','title','education','experience','skills','about'];
 const values=Object.fromEntries(fields.map(k=>[k, typeof body[k] === 'string' ? body[k].trim().slice(0,5000) : user[k] || '']));
 if(!values.name) return reply({error:'نام و نام خانوادگی را وارد کنید.'},400);
 const extra=parseExtra(user.profile_extra);
 for (const k of ['gender','marital','military','birthdate','salary','address','languages','certificates']) {
   if (typeof body[k] === 'string') extra[k]=body[k].trim().slice(0,2000);
 }
 for (const [key,config] of Object.entries(resumeCollections)) {
   if (!(key in body)) continue;
   const items=cleanCollection(body[key],config.fields);
   if (!items) return reply({error:'ساختار اطلاعات رزومه معتبر نیست.'},400);
   extra[key]=items;
   const summary=summarizeCollection(items,config.fields);
   if (config.legacy === 'certificates') extra.certificates=summary;
   else values[config.legacy]=summary;
 }
 db.prepare('UPDATE users SET name=?,phone=?,title=?,education=?,experience=?,skills=?,about=?,profile_extra=? WHERE id=?').run(...fields.map(k=>values[k]),JSON.stringify(extra),user.id);
 return reply({user:safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))});
}
if(action==='resume') { const data=String(body.data||''),name=String(body.name||''); if(!/^data:application\/pdf;base64,/.test(data)||data.length>4200000||!name.toLowerCase().endsWith('.pdf')) return reply({error:'فقط فایل PDF تا حجم ۳ مگابایت پذیرفته می‌شود.'},400); db.prepare('UPDATE users SET resume_name=?,resume_data=? WHERE id=?').run(name.slice(0,200),data,user.id); return reply({user:safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))}); }
if(action==='apply') { const job=jobs.find(j=>j.id===Number(body.jobId)); if(!job) return reply({error:'فرصت شغلی یافت نشد.'},404); if(!user.phone||(!user.resume_name&&!user.about&&!user.experience)) return reply({error:'ابتدا شماره تماس و رزومه یا سوابق خود را در پروفایل تکمیل کنید.'},400); try { db.prepare('INSERT INTO applications(user_id,job_id) VALUES (?,?)').run(user.id,job.id); } catch { return reply({error:'درخواست شما برای این فرصت قبلاً ثبت شده است.'},409); } return reply({ok:true}); }
return reply({error:'یافت نشد'},404); } catch(e) { console.error(e); return reply({error:'خطایی رخ داد. دوباره تلاش کنید.'},500); } }

