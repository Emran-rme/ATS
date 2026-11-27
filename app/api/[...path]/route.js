import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, hash, verify, currentUser, startSession, safeUser, cookiePath } from '../../../lib/db';
import { getJobs } from '../../../lib/sharepoint';
import { runSharePointOutbox } from '../../../lib/sharepoint-outbox';
import { resumeCollections, parseExtra, cleanCollection, summarizeCollection } from '../../../lib/resume';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply=(data,status=200)=>NextResponse.json(data,{status});
export async function GET(req,{params}) { const {path}=await params; if(path[0]==='jobs') { try { return reply(await getJobs()); } catch { return reply({error:'دریافت فرصت‌های شغلی در حال حاضر امکان‌پذیر نیست.'},503); } } const user=await currentUser(); if(path[0]==='me') return reply({user:safeUser(user)}); if(path[0]==='applications') { if(!user) return reply({error:'ابتدا وارد حساب خود شوید.'},401); return reply({applications:db.prepare("SELECT applications.*, COALESCE(sharepoint_outbox.status, 'legacy') AS sync_status FROM applications LEFT JOIN sharepoint_outbox ON sharepoint_outbox.application_id=applications.id WHERE applications.user_id=? ORDER BY applications.id DESC").all(user.id)}); } return reply({error:'یافت نشد'},404); }
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
if(action==='apply') { let listing; try { listing=await getJobs({forceRefresh:true}); } catch { return reply({error:'ارتباط با سامانه آگهی‌ها برقرار نیست. دوباره تلاش کنید.'},503); } if(listing.stale) return reply({error:'امکان بررسی وضعیت آگهی وجود ندارد. لطفاً بعداً تلاش کنید.'},503); const job=listing.jobs.find(j=>j.id===Number(body.jobId)); if(!job) return reply({error:'فرصت شغلی فعال یافت نشد.'},404); if(job.acceptingApplications !== true) return reply({error:'مهلت ارسال رزومه برای این فرصت شغلی به پایان رسیده است.'},409); if(!user.phone||(!user.resume_name&&!user.about&&!user.experience)) return reply({error:'ابتدا شماره تماس و رزومه یا سوابق خود را در پروفایل تکمیل کنید.'},400); if(db.prepare('SELECT id FROM applications WHERE user_id=? AND job_id=?').get(user.id,job.id)) return reply({error:'درخواست شما برای این فرصت قبلاً ثبت شده است.'},409); const extra=parseExtra(user.profile_extra); const payload={name:user.name,email:user.email,phone:user.phone,title:user.title,skills:user.skills,education:user.education,experience:user.experience,about:user.about,birthdate:extra.birthdate||'',gender:extra.gender||'',marital:extra.marital||'',military:extra.military||'',salary:extra.salary||'',address:extra.address||'',languages:extra.languages||'',certificates:extra.certificates||'',jobId:Math.abs(job.id),resumeData:user.resume_data||''}; db.exec('BEGIN IMMEDIATE'); try { const application=db.prepare('INSERT INTO applications(user_id,job_id,job_title) VALUES (?,?,?)').run(user.id,job.id,job.title); db.prepare('INSERT INTO sharepoint_outbox(application_id,user_id,payload) VALUES(?,?,?)').run(application.lastInsertRowid,user.id,JSON.stringify(payload)); db.exec('COMMIT'); } catch(error) { db.exec('ROLLBACK'); throw error; } void runSharePointOutbox().catch(() => console.error('SharePoint synchronization worker failed')); return reply({ok:true}); }
return reply({error:'یافت نشد'},404); } catch(e) { console.error(e); return reply({error:'خطایی رخ داد. دوباره تلاش کنید.'},500); } }

