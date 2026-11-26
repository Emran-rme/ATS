'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BriefcaseBusiness, ChevronDown, Download, Eye, EyeOff, FileText, LockKeyhole, LogOut, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jobs } from '../../lib/jobs';
import Dropdown from '../dropdown';
import ResumeDetails from './resume-details';

const statuses = ['در انتظار بررسی', 'در حال بررسی', 'دعوت به مصاحبه', 'پذیرفته شده', 'عدم پذیرش'];
const statusColors = {
  'در انتظار بررسی': 'bg-amber-50 text-amber-700',
  'در حال بررسی': 'bg-blue-50 text-blue-700',
  'دعوت به مصاحبه': 'bg-violet-50 text-violet-700',
  'پذیرفته شده': 'bg-emerald-50 text-emerald-700',
  'عدم پذیرش': 'bg-slate-100 text-slate-600',
};

async function post(body) {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_PATH || '') + '/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'خطایی رخ داده است.');
  return data;
}

export default function Admin() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  async function load() {
    const response = await fetch((process.env.NEXT_PUBLIC_BASE_PATH || '') + '/api/admin', { cache: 'no-store' });
    if (response.status === 401) { setItems(null); return; }
    if (!response.ok) throw new Error('دریافت درخواست‌ها با مشکل مواجه شد.');
    setItems((await response.json()).applications);
  }
  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  async function login(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await post({ action: 'login', password }); await load(); setPassword(''); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    try { await post({ action: 'logout' }); setItems(null); setExpanded(null); setQuery(''); setFilter(''); }
    catch (e) { toast.error(e.message); }
  }
  async function change(id, status) {
    if (!status) return;
    try { await post({ action: 'status', id, status }); await load(); toast.success('وضعیت درخواست به‌روزرسانی شد.'); }
    catch (e) { toast.error(e.message); }
  }
  async function resume(userId) {
    try {
      const data = await post({ action: 'resume', userId });
      const link = document.createElement('a'); link.href = data.resume_data; link.download = data.resume_name; link.click();
    } catch (e) { toast.error(e.message); }
  }
  const filtered = useMemo(() => (items || []).filter(a => {
    const job = jobs.find(j => j.id === a.job_id);
    return (!filter || a.status === filter) && [a.name, a.email, a.phone, a.job_title || job?.title].some(value => String(value || '').toLowerCase().includes(query.trim().toLowerCase()));
  }), [items, query, filter]);

  if (loading) return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">در حال بارگذاری...</main>;

  if (items === null) return <main className="flex min-h-screen items-center justify-center bg-[#f3f7fa] px-4 py-12">
    <div className="w-full max-w-[980px] overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_24px_80px_rgba(17,54,83,.10)] md:grid md:grid-cols-2">
      <div className="relative overflow-hidden bg-[#07539b] p-9 text-white sm:p-12">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full border-[45px] border-white/5" />
        <div className="relative flex h-full min-h-56 flex-col justify-between gap-14">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><ShieldCheck size={22}/></span><span className="font-bold">گل‌پخش اول <span className="mr-2 text-xs font-normal text-blue-100">| مدیریت استخدام</span></span></div>
          <div><div className="mb-5 h-1 w-10 rounded-full bg-[#ffda00]"/><h1 className="text-2xl font-bold leading-loose sm:text-3xl">همراه فرصت‌های<br/> تازه، از همین‌جا</h1><p className="mt-4 max-w-xs text-sm leading-8 text-blue-100">فضایی ساده برای بررسی رزومه‌ها و مدیریت درخواست‌های همکاری.</p></div>
          <p className="text-xs text-blue-100/80">سامانه استخدام شرکت گل‌پخش اول</p>
        </div>
      </div>
      <div className="flex items-center p-7 sm:p-12">
        <form className="w-full" onSubmit={login}>
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#07539b]"><LockKeyhole size={21}/></div>
          <h2 className="text-2xl font-bold text-[#18344c]">ورود به پنل مدیریت</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">برای مشاهده و بررسی درخواست‌ها، رمز مدیریت را وارد کنید.</p>
          <label htmlFor="admin-password" className="mb-2 mt-8 block text-sm font-bold text-slate-700">رمز مدیریت</label>
          <div className="relative">
            <input id="admin-password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="رمز خود را وارد کنید" className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#07539b] focus:bg-white focus:ring-4 focus:ring-blue-50" />
            <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'پنهان کردن رمز' : 'نمایش رمز'} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#07539b]">{visible ? <EyeOff size={19}/> : <Eye size={19}/>}</button>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700">{error}</p>}
          <button disabled={busy} className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#07539b] text-sm font-bold text-white transition hover:bg-[#064783]">{busy ? 'در حال ورود...' : 'ورود به پنل'} <ArrowLeft size={17}/></button>
          <Link href="/" className="mt-7 flex items-center justify-center gap-2 text-sm text-slate-500 transition hover:text-[#07539b]">بازگشت به سایت <ArrowLeft size={15}/></Link>
        </form>
      </div>
    </div>
  </main>;

  return <main className="min-h-screen bg-[#f4f7f9] pb-16">
    <ToastContainer position="top-left" rtl />
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#07539b] text-white"><ShieldCheck size={21}/></span><div><p className="font-bold text-[#18344c]">مدیریت استخدام</p><p className="mt-1 text-xs text-slate-400">شرکت گل‌پخش اول</p></div></div>
        <div className="flex items-center gap-3"><Link href="/" className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-[#07539b]">مشاهده سایت</Link><button onClick={logout} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><LogOut size={15}/> خروج</button></div>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-5 pt-9 sm:px-8">
      <div className="mb-8"><div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#07539b]"><span className="h-1 w-7 rounded-full bg-[#ffda00]"/> میز کار مدیر</div><h1 className="text-2xl font-bold text-[#18344c] sm:text-3xl">درخواست‌های همکاری</h1><p className="mt-3 text-sm text-slate-500">رزومه‌ها را بررسی کنید و وضعیت هر درخواست را به‌روز نگه دارید.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[{label:'کل درخواست‌ها', value:items.length, icon:UsersRound, color:'bg-blue-50 text-[#07539b]'}, {label:'در انتظار بررسی', value:items.filter(a=>a.status===statuses[0]).length, icon:FileText, color:'bg-amber-50 text-amber-600'}, {label:'دعوت به مصاحبه', value:items.filter(a=>a.status===statuses[2]).length, icon:BriefcaseBusiness, color:'bg-violet-50 text-violet-600'}].map(({label,value,icon:Icon,color})=><div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><span className={'flex h-12 w-12 items-center justify-center rounded-xl '+color}><Icon size={21}/></span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-[#18344c]">{value.toLocaleString('fa-IR')}</p></div></div>)}
      </div>
      <section className="mt-7 rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><h2 className="font-bold text-[#18344c]">فهرست درخواست‌ها</h2><p className="mt-1 text-xs text-slate-400">{filtered.length.toLocaleString('fa-IR')} درخواست نمایش داده می‌شود</p></div><div className="flex w-full flex-wrap gap-3 sm:w-auto"><label className="relative min-w-48 flex-1"><Search size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجوی نام یا عنوان شغلی" className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 text-xs outline-none focus:border-[#07539b] focus:ring-4 focus:ring-blue-50"/></label><div className="w-full sm:w-44"><Dropdown value={filter} onChange={setFilter} options={statuses} placeholder="همه وضعیت‌ها" label="فیلتر وضعیت" compact /></div></div></div>
        {filtered.length === 0 ? <div className="px-6 py-20 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400"><FileText size={23}/></div><p className="mt-5 font-bold text-slate-600">{items.length ? 'درخواستی با این مشخصات پیدا نشد.' : 'هنوز درخواستی ثبت نشده است.'}</p><p className="mt-2 text-xs text-slate-400">{items.length ? 'عبارت جستجو یا وضعیت انتخابی را تغییر دهید.' : 'درخواست‌های جدید در این بخش نمایش داده می‌شوند.'}</p></div> :
          <div className="divide-y divide-slate-100">{filtered.map(a => {
            const job = jobs.find(j=>j.id===a.job_id);
            return <article key={a.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-[#07539b]">{a.name?.trim()?.charAt(0) || 'ک'}</div><div className="min-w-0 flex-1"><h3 className="font-bold text-[#18344c]">{a.name}</h3><p className="mt-1 text-sm text-slate-500">{a.job_title || job?.title || 'فرصت شغلی'} <span className="mx-1 text-slate-300">•</span> {a.phone || 'شماره ثبت نشده'}</p><p dir="ltr" className="mt-1 text-right text-xs text-slate-400">{a.email}</p></div><span className={'rounded-full px-3 py-1.5 text-xs font-bold '+(statusColors[a.status] || 'bg-slate-100 text-slate-600')}>{a.status}</span></div>
              <div className="mt-5 flex flex-wrap items-center gap-3"><div className="w-48"><Dropdown label="وضعیت درخواست" value={a.status} onChange={value=>change(a.id,value)} options={statuses} placeholder="انتخاب وضعیت" compact /></div><button onClick={()=>setExpanded(expanded===a.id?null:a.id)} aria-expanded={expanded===a.id} aria-controls={expanded===a.id ? `resume-details-${a.id}` : undefined} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#07539b] hover:bg-blue-50">جزئیات رزومه <ChevronDown size={15} className={expanded===a.id?'rotate-180':''}/></button>{a.resume_name && <button onClick={()=>resume(a.user_id)} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"><Download size={15}/> دریافت رزومه</button>}</div>
              {expanded===a.id && <ResumeDetails applicant={a} id={`resume-details-${a.id}`}/>}
            </article>;
          })}</div>}
      </section>
    </div>
  </main>;
}
