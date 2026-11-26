"use client";
import { useCareer } from "./career";
export default function AccountPage({ title, description, children }) {
    const { user, loaded, setAuth } = useCareer();
    return <main className="min-h-[75vh] bg-[#f7f9f9] px-4 pb-20 pt-10 sm:px-6 lg:px-[max(24px,calc((100%-1150px)/2))]">
        <div className="mb-6 [&_h1]:mb-1 [&_h1]:mt-3 [&_h1]:text-2xl [&_h1]:font-bold [&_p]:text-xs [&_p]:text-slate-400"><div><div className="flex items-center gap-2 text-xs font-bold text-[#07539b] [&_span]:h-[3px] [&_span]:w-5 [&_span]:rounded-full [&_span]:bg-[#ffda00]"><span /> پنل کاربری</div><h1>{title}</h1><p>{description}</p></div></div>
        {loaded && !user ? <div className="rounded-2xl border border-slate-100 bg-white p-6 py-10 text-center text-slate-400 shadow-sm"><p>برای مشاهده این صفحه وارد حساب خود شوید.</p><button className="mt-5 inline-flex items-center justify-center gap-4 rounded-xl bg-[#07539b] px-5 py-3.5 text-[13px] font-bold text-white transition hover:bg-[#06477f]" onClick={() => setAuth("login")}>ورود / ثبت‌نام</button></div> : user ? children : null}
    </main>;
}
