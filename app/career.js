"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, ChevronDown, FileText, LogOut, Menu, UserRound, X } from "lucide-react";
import { withResumeCollections } from "../lib/resume";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const CareerContext = createContext(null);
export const useCareer = () => useContext(CareerContext);
export async function api(path, data) {
    const r = await fetch(
        (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/api/" + path,
        data
            ? {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
              }
            : { cache: "no-store" },
    );
    const d = await r.json();
    if (!r.ok) throw Error(d.error || "خطایی رخ داد");
    return d;
}
const enrich = withResumeCollections;
export function Flower() {
    return (
        <span
            className="relative inline-block text-[35px] leading-none text-[#07539b] after:absolute after:left-[40%] after:top-[41%] after:h-[19%] after:w-[19%] after:rounded-full after:bg-[#ffda00] after:content-[''] small"
            aria-hidden="true"
        >
            ✿
        </span>
    );
}
export default function Career({ children }) {
    const router = useRouter(), path = usePathname(), isProfile = path === "/profile", isApps = path === "/applications", isJobs = path.startsWith("/jobs");
    const [user, setUser] = useState(null), [loaded, setLoaded] = useState(false),
        [applications, setApplications] = useState([]), [auth, setAuth] = useState(""), [form, setForm] = useState({}),
        [menu, setMenu] = useState(false), [mobile, setMobile] = useState(false), [busy, setBusy] = useState(false),
        [jobs, setJobs] = useState([]), [jobsLoading, setJobsLoading] = useState(true), [jobsError, setJobsError] = useState(""), [jobsStale, setJobsStale] = useState(false);
    const notify = (text) => toast.success(text);
    async function refresh() {
        try {
            const d = await api("me");
            setUser(enrich(d.user));
            if (d.user)
                setApplications((await api("applications")).applications);
        } finally {
            setLoaded(true);
        }
    }
    useEffect(() => {
        refresh().catch(() => setLoaded(true));
    }, []);
    useEffect(() => {
        api("jobs").then(data => { setJobs(data.jobs); setJobsStale(data.stale); })
            .catch(() => setJobsError("دریافت فرصت‌های شغلی در حال حاضر امکان‌پذیر نیست."))
            .finally(() => setJobsLoading(false));
    }, []);
    function go(url) {
        setMenu(false);
        setMobile(false);
        router.push(url);
    }
    function protectedGo(url) {
        if (!user) {
            setAuth("login");
            return;
        }
        go(url);
    }
    async function submitAuth(e) {
        e.preventDefault();
        setBusy(true);
        try {
            const d = await api(auth, form);
            setUser(enrich(d.user));
            setAuth("");
            setForm({});
            notify("با موفقیت وارد شدید.");
            if (auth === "login")
                setApplications((await api("applications")).applications);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    }
    async function logout() {
        await api("logout", {});
        setUser(null);
        setApplications([]);
        go("/");
        notify("از حساب خارج شدید.");
    }
    async function apply(job) {
        if (!user) {
            setAuth("login");
            return;
        }
        try {
            await api("apply", { jobId: job.id });
            setApplications((await api("applications")).applications);
            notify("درخواست شما با موفقیت ثبت شد.");
            go("/applications");
        } catch (e) {
            toast.error(e.message);
            if (
                !user.phone ||
                (!user.resume_name && !user.about && !user.experience)
            )
                go("/profile");
        }
    }
    return <CareerContext.Provider value={{ user, setUser, loaded, applications, jobs, jobsLoading, jobsError, jobsStale, go, protectedGo, setAuth, apply }}>
            <header className="h-[76px] border-b border-slate-100 bg-white">
                <div className="mx-auto flex h-full max-w-[1240px] items-center gap-5 px-4 md:gap-10 md:px-6">
                    <button
                        className="flex shrink-0 items-center gap-4 border-0 bg-transparent p-0 [&_img]:h-[60px] [&_img]:w-[155px] [&_img]:object-contain [&_img]:max-sm:w-[125px]"
                        onClick={() => go("/")}
                    >
                        <img src={(process.env.NEXT_PUBLIC_BASE_PATH || "") + "/logo.png"} alt="گل‌پخش اول" />
                        <span className="hidden h-7 w-px bg-slate-200 lg:block" />
                        {/* <span className="hidden text-xs font-bold text-slate-500 lg:block">فرصت‌های شغلی</span> */}
                    </button>
                    <nav
                        className={
                            "absolute inset-x-0 top-[76px] z-30 flex-col gap-1 bg-white p-4 shadow-lg md:static md:flex md:h-full md:flex-row md:items-center md:gap-8 md:p-0 md:shadow-none [&_button]:relative [&_button]:rounded-lg [&_button]:px-3 [&_button]:py-3 [&_button]:text-right [&_button]:text-[13px] [&_button]:font-bold [&_button]:text-slate-500 [&_button]:hover:bg-slate-50 [&_button]:md:h-full [&_button]:md:rounded-none [&_button]:md:px-0 [&_button]:md:hover:bg-transparent " +
                            (mobile ? "flex" : "hidden")
                        }
                    >
                        <button
                            className={
                                isJobs
                                    ? "text-[#07539b]! after:absolute after:inset-x-2 after:bottom-0 after:hidden after:h-0.5 after:rounded-full after:bg-[#07539b] after:content-[''] md:after:block"
                                    : ""
                            }
                            onClick={() => go("/jobs")}
                        >
                            فرصت‌های شغلی
                        </button>
                        <button
                            className={
                                isProfile
                                    ? "text-[#07539b]! after:absolute after:inset-x-2 after:bottom-0 after:hidden after:h-0.5 after:rounded-full after:bg-[#07539b] after:content-[''] md:after:block"
                                    : ""
                            }
                            onClick={() => protectedGo("/profile")}
                        >
                            رزومه من
                        </button>
                        <button
                            className={
                                isApps
                                    ? "text-[#07539b]! after:absolute after:inset-x-2 after:bottom-0 after:hidden after:h-0.5 after:rounded-full after:bg-[#07539b] after:content-[''] md:after:block"
                                    : ""
                            }
                            onClick={() => protectedGo("/applications")}
                        >
                            درخواست‌های من
                        </button>
                    </nav>
                    <div className="relative mr-auto flex items-center gap-2">
                        {user ? (
                            <>
                                <button
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-[#07539b] transition hover:border-blue-200 hover:bg-blue-50"
                                    onClick={() => setMenu(!menu)}
                                    aria-expanded={menu}
                                >
                                    <UserRound size={17} />
                                    {user.name}
                                    <ChevronDown size={15} />
                                </button>
                                {menu && (
                                    <div className="absolute left-0 top-[calc(100%+12px)] z-40 w-64 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_18px_55px_rgba(21,52,75,.16)] [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:gap-3 [&>button]:rounded-lg [&>button]:px-3 [&>button]:py-3 [&>button]:text-right [&>button]:text-[13px] [&>button]:text-slate-600 [&>button]:hover:bg-slate-50">
                                        <div className="flex items-center gap-3 px-1 pb-4 pt-2 [&_b]:block [&_small]:block [&_small]:mt-1 [&_small]:text-xs [&_small]:text-slate-400">
                                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eaf4f7] text-[#07539b]">
                                                <UserRound size={22} />
                                            </span>
                                            <div>
                                                <b>{user.name}</b>
                                                <small>
                                                    {user.title ||
                                                        "کارجوی گل‌پخش اول"}
                                                </small>
                                            </div>
                                        </div>
                                        <button
                                            className="justify-center bg-[#07539b]! font-bold text-white! hover:bg-[#06477f]!"
                                            onClick={() => go("/profile")}
                                        >
                                            مشاهده و تکمیل رزومه
                                        </button>
                                        <button
                                            onClick={() => go("/applications")}
                                        >
                                            <FileText size={17} /> درخواست‌های
                                            ارسال‌شده
                                        </button>
                                        <button onClick={() => go("/jobs")}>
                                            <BriefcaseBusiness size={17} />{" "}
                                            فرصت‌های شغلی
                                        </button>
                                        <button onClick={logout}>
                                            <LogOut size={17} /> خروج از حساب
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <button
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-[#07539b] transition hover:border-blue-200 hover:bg-blue-50"
                                onClick={() => {
                                    setAuth("login");
                                    setForm({});
                                }}
                            >
                                <UserRound size={17} /> ورود / ثبت‌نام
                            </button>
                        )}
                        <button
                            className="grid place-items-center rounded-lg p-2 text-[#07539b] md:hidden"
                            onClick={() => setMobile(!mobile)}
                            aria-label="منو"
                        >
                            <Menu />
                        </button>
                    </div>
                </div>
            </header>
            {children}
            <footer className="border-t border-slate-100 bg-[#f8fafb]">
                <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 px-6 py-12 md:grid-cols-[2fr_1fr_1.4fr_auto] [&_p]:text-xs [&_p]:leading-7 [&_p]:text-slate-400 [&_span]:text-xs [&_span]:leading-7 [&_span]:text-slate-400 [&_button]:text-xs [&_button]:leading-7 [&_button]:text-slate-400 [&_b]:mb-4 [&_b]:block [&_b]:text-sm [&_button]:block">
                    <div className="col-span-2 md:col-span-1 [&_img]:h-16 [&_img]:w-[180px] [&_img]:object-contain">
                        <img src={(process.env.NEXT_PUBLIC_BASE_PATH || "") + "/logo.png"} alt="گل‌پخش اول" />
                        <p>کنار هم، برای ساختن آینده‌ای روشن‌تر.</p>
                    </div>
                    <div>
                        <b>دسترسی سریع</b>
                        <button onClick={() => go("/jobs")}>
                            فرصت‌های شغلی
                        </button>
                        <button onClick={() => protectedGo("/profile")}>
                            ساخت رزومه
                        </button>
                    </div>
                    <div>
                        <b>همراه ما باشید</b>
                        <p>مشتاق آشنایی با شما هستیم.</p>
                        <span>به خانواده گل‌پخش اول بپیوندید.</span>
                    </div>
                    <Flower />
                </div>
                <div className="mx-auto max-w-[1150px] border-t border-slate-200 px-6 py-5 text-xs text-slate-400">
                    تمامی حقوق این سامانه متعلق به شرکت گل‌پخش اول است.
                </div>
            </footer>
            {auth && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#10283d]/70 p-4"
                    onClick={() => setAuth("")}
                >
                    <form
                        className="relative max-h-[90vh] w-full overflow-auto rounded-2xl bg-white p-7 sm:p-8 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-[#fbfcfc] [&_input]:px-4 [&_input]:py-3 [&_input]:text-[13px] [&_input]:font-normal [&_input]:text-slate-700 [&_input]:outline-none [&_input]:transition [&_input]:placeholder:text-slate-400 [&_input]:focus:border-[#7eb1cb] [&_input]:focus:bg-white [&_input]:focus:ring-4 [&_input]:focus:ring-blue-50 max-w-[410px] text-center [&_h2]:mb-1 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&>p]:mb-6 [&>p]:text-xs [&>p]:text-slate-400 [&_label]:my-4 [&_label]:flex [&_label]:flex-col [&_label]:gap-2 [&_label]:text-right [&_label]:text-xs [&_label]:font-bold [&_label]:text-slate-500"
                        onSubmit={submitAuth}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="absolute left-5 top-5 rounded-lg bg-slate-50 p-2 text-slate-400"
                            onClick={() => setAuth("")}
                        >
                            <X size={20} />
                        </button>
                        <Flower />
                        <h2>
                            {auth === "login"
                                ? "خوش آمدید!"
                                : "به جمع ما بپیوندید"}
                        </h2>
                        <p>
                            {auth === "login"
                                ? "برای ادامه وارد حساب کاربری خود شوید."
                                : "حساب کاربری خود را در چند لحظه بسازید."}
                        </p>
                        {auth === "register" && (
                            <label>
                                نام و نام خانوادگی
                                <input
                                    required
                                    value={form.name || ""}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </label>
                        )}
                        <label>
                            ایمیل
                            <input
                                type="email"
                                required
                                value={form.email || ""}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                placeholder="example@email.com"
                                dir="ltr"
                            />
                        </label>
                        <label>
                            رمز عبور
                            <input
                                type="password"
                                required
                                minLength="8"
                                value={form.password || ""}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        password: e.target.value,
                                    })
                                }
                                placeholder="حداقل ۸ نویسه"
                            />
                        </label>
                        <button
                            className="inline-flex items-center justify-center gap-4 rounded-xl px-5 py-3.5 text-[13px] font-bold transition mt-5 bg-[#07539b] text-white hover:bg-[#06477f] w-full"
                            disabled={busy}
                        >
                            {auth === "login"
                                ? "ورود به حساب"
                                : "ساخت حساب کاربری"}{" "}
                            <ArrowLeft size={17} />
                        </button>
                        <div className="mt-5 text-xs text-slate-400 [&_button]:font-bold [&_button]:text-[#07539b]">
                            {auth === "login"
                                ? "حساب کاربری ندارید؟"
                                : "قبلاً ثبت‌نام کرده‌اید؟"}{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setAuth(
                                        auth === "login" ? "register" : "login",
                                    );
                                    setForm({});
                                }}
                            >
                                {auth === "login"
                                    ? "ثبت‌نام کنید"
                                    : "وارد شوید"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <ToastContainer toastClassName="font-sans!" position="bottom-left" rtl autoClose={4500} newestOnTop closeOnClick pauseOnHover theme="light" />
        </CareerContext.Provider>;
}
