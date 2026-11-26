"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    ArrowLeft,
    BriefcaseBusiness,
    Building2,
    Check,
    ChevronDown,
    Clock3,
    FileText,
    GraduationCap,
    Heart,
    LogOut,
    Menu,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    UploadCloud,
    UserRound,
    X,
} from "lucide-react";
import { jobs as legacyJobs } from "../lib/jobs";
import { withResumeCollections } from "../lib/resume";
import ResumeSection from "./resume-section";
import { JobsBoard, JobDetails } from "./job-board";
import Dropdown from "./dropdown";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const fa = (n) => new Intl.NumberFormat("fa-IR").format(n);
async function api(path, data) {
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
function Flower() {
    return (
        <span
            className="relative inline-block text-[35px] leading-none text-[#07539b] after:absolute after:left-[40%] after:top-[41%] after:h-[19%] after:w-[19%] after:rounded-full after:bg-[#ffda00] after:content-[''] small"
            aria-hidden="true"
        >
            ✿
        </span>
    );
}
export default function Career() {
    const router = useRouter(),
        path = usePathname(),
        isProfile = path === "/profile",
        isApps = path === "/applications",
        isHome = path === "/",
        isJobs = path.startsWith("/jobs");
    const [user, setUser] = useState(null),
        [loaded, setLoaded] = useState(false),
        [applications, setApplications] = useState([]),
        [auth, setAuth] = useState(""),
        [form, setForm] = useState({}),
        [menu, setMenu] = useState(false),
        [mobile, setMobile] = useState(false),
        [query, setQuery] = useState(""),
        [dept, setDept] = useState(""),
        [type, setType] = useState(""),
        [experience, setExperience] = useState(""),
        [section, setSection] = useState(""),
        [draft, setDraft] = useState({}),
        [busy, setBusy] = useState(false),
        [jobs, setJobs] = useState([]),
        [jobsLoading, setJobsLoading] = useState(true),
        [jobsError, setJobsError] = useState(""),
        [jobsStale, setJobsStale] = useState(false);
    const selected = jobs.find((j) => String(j.id) === path.split("/")[2]);
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
    async function save(e) {
        e.preventDefault();
        setBusy(true);
        try {
            const d = await api("profile", draft);
            setUser(enrich(d.user));
            setSection("");
            notify("اطلاعات ذخیره شد.");
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    }
    function edit(name) {
        setDraft({ ...user });
        setSection(name);
    }
    async function upload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== "application/pdf" || file.size > 3 * 1024 * 1024) {
            toast.error("فایل PDF تا حجم ۳ مگابایت انتخاب کنید.");
            return;
        }
        const r = new FileReader();
        r.onload = async () => {
            try {
                const d = await api("resume", {
                    name: file.name,
                    data: r.result,
                });
                setUser(enrich(d.user));
                notify("رزومه بارگذاری شد.");
            } catch (e) {
                toast.error(e.message);
            }
        };
        r.readAsDataURL(file);
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
    const filtered = jobs.filter(
        (j) =>
            (!dept || j.department === dept) &&
            (!type || j.type === type) &&
            (!experience || j.experience === experience) &&
            `${j.title} ${j.department}`.includes(query.trim()),
    );
    const profileGroups = [
        {
            key: "basic",
            title: "اطلاعات اولیه",
            subtitle: "راه‌های ارتباطی و معرفی شما",
            icon: <UserRound size={19} />,
            fields: [
                ["name", "نام و نام خانوادگی"],
                ["title", "عنوان شغلی"],
                ["phone", "شماره موبایل"],
                ["gender", "جنسیت", ["زن", "مرد"]],
                ["marital", "وضعیت تأهل", ["مجرد", "متأهل"]],
                [
                    "military",
                    "وضعیت نظام وظیفه",
                    ["انجام شده", "معاف", "مشمول", "غیرمشمول"],
                ],
                ["birthdate", "تاریخ تولد"],
                ["salary", "حقوق درخواستی"],
                ["address", "محل سکونت"],
            ],
        },
        {
            key: "about",
            title: "درباره من",
            subtitle: "چند جمله درباره مسیر حرفه‌ای شما",
            icon: <UserRound size={19} />,
            fields: [["about", "درباره من", true]],
        },
        {
            key: "experience",
            title: "سوابق شغلی",
            subtitle: "تجربه‌هایی که شما را به اینجا رسانده‌اند",
            icon: <BriefcaseBusiness size={19} />,
            collection: "experience_items",
            itemLabel: "سابقه شغلی",
            fields: [
                ["role", "عنوان شغلی"],
                ["company", "نام شرکت"],
                ["start", "تاریخ شروع"],
                ["end", "تاریخ پایان"],
                ["description", "شرح فعالیت‌ها", true],
            ],
        },
        {
            key: "education",
            title: "سوابق تحصیلی",
            subtitle: "تحصیلات و مسیر یادگیری شما",
            icon: <GraduationCap size={19} />,
            collection: "education_items",
            itemLabel: "سابقه تحصیلی",
            fields: [
                [
                    "degree",
                    "مقطع تحصیلی",
                    [
                        "دیپلم",
                        "کاردانی",
                        "کارشناسی",
                        "کارشناسی ارشد",
                        "دکتری",
                        "سایر",
                    ],
                ],
                ["field", "رشته تحصیلی"],
                ["institution", "دانشگاه یا مؤسسه"],
                ["start", "تاریخ شروع"],
                ["end", "تاریخ پایان"],
                ["description", "توضیحات", true],
            ],
        },
        {
            key: "skills",
            title: "مهارت‌ها",
            subtitle: "توانمندی‌هایی که در کار از آن‌ها استفاده می‌کنید",
            icon: <Check size={19} />,
            collection: "skill_items",
            itemLabel: "مهارت",
            fields: [
                ["name", "نام مهارت"],
                [
                    "level",
                    "سطح مهارت",
                    ["مقدماتی", "متوسط", "پیشرفته", "حرفه‌ای"],
                ],
            ],
        },
        {
            key: "certificates",
            title: "دوره‌ها و مدارک",
            subtitle: "گواهینامه‌ها و آموزش‌های تکمیلی",
            icon: <FileText size={19} />,
            collection: "certificate_items",
            itemLabel: "مدرک یا دوره",
            fields: [
                ["name", "نام مدرک یا دوره"],
                ["issuer", "مؤسسه صادرکننده"],
                ["date", "تاریخ دریافت"],
                ["description", "توضیحات", true],
            ],
        },
        {
            key: "languages",
            title: "زبان‌ها",
            subtitle: "زبان‌هایی که با آن‌ها آشنا هستید",
            icon: <Check size={19} />,
            fields: [["languages", "زبان‌ها و سطح تسلط", true]],
        },
    ];
    const completion = user
        ? Math.round(
              ([
                  "name",
                  "phone",
                  "title",
                  "about",
                  "experience",
                  "education",
                  "skills",
              ].filter((k) => user[k]).length /
                  7) *
                  100,
          )
        : 0;
    return (
        <>
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
            {isHome && (
                <>
                    <section className="overflow-hidden bg-[#f3f8fa] text-[#173653] [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-[30px] [&_h1]:font-bold [&_h1]:leading-[1.7] [&_h1]:sm:text-[42px] [&_h1_em]:not-italic [&_h1_em]:text-[#07539b] [&_p]:mb-6 [&_p]:max-w-[490px] [&_p]:text-sm [&_p]:leading-8 [&_p]:text-slate-500">
                        <div className="mx-auto flex min-h-[390px] max-w-[1150px] items-center justify-between gap-8 px-6 py-14">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe9ef] bg-white px-3 py-1.5 text-xs text-[#27658b]">
                                    <span className="h-2 w-2 rounded-full bg-[#ffda00]" />{" "}
                                    آینده از همین‌جا شروع می‌شود
                                </div>
                                <h1>
                                    کنار هم، مسیرهای
                                    <br />
                                    <em>تازه می‌سازیم.</em>
                                </h1>
                                <p>
                                    به خانواده گل‌پخش اول بپیوندید و فصل تازه‌ای
                                    از مسیر حرفه‌ای خود را با ما آغاز کنید.
                                </p>
                                <button
                                    className="inline-flex items-center justify-center gap-4 rounded-xl px-5 py-3.5 text-[13px] font-bold transition bg-[#ffda00] text-[#173653] hover:bg-[#f5cb00]"
                                    onClick={() => go("/jobs")}
                                >
                                    مشاهده فرصت‌های شغلی <ArrowLeft size={18} />
                                </button>
                                <button
                                    className="mr-4 inline-flex items-center gap-2 font-bold text-[#07539b]"
                                    onClick={() => protectedGo("/profile")}
                                >
                                    ساخت رزومه <ArrowLeft size={16} />
                                </button>
                            </div>
                            <div className="hidden h-[290px] w-[290px] shrink-0 flex-col items-center justify-center rounded-full bg-[#e4f1f7] font-bold text-[#07539b] md:flex [&_span]:text-sm [&_small]:mt-5 [&_small]:text-[9px] [&_small]:tracking-[.2em] [&_small]:text-[#6a94aa]">
                                <div className="relative text-[145px] leading-none after:absolute after:left-[42%] after:top-[32%] after:h-[16%] after:w-[16%] after:rounded-full after:bg-[#ffd800] after:content-['']">
                                    ✿
                                </div>
                                <span>آینده را با هم می‌سازیم</span>
                                <small>GOLPAKHSH-E AVAL</small>
                            </div>
                        </div>
                    </section>
                    <section className="mx-auto max-w-[1150px] px-6 py-16 [&_h2]:my-3 [&_h2]:text-2xl [&_h2]:font-bold [&>p]:text-sm [&>p]:text-slate-400">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#07539b] [&_span]:h-[3px] [&_span]:w-5 [&_span]:rounded-full [&_span]:bg-[#ffda00]">
                            <span /> فرصت‌های همکاری
                        </div>
                        <h2>فرصت بعدی شما اینجاست</h2>
                        <p>جای خودت را در تیم گل‌پخش اول پیدا کن.</p>
                        <div className="my-8 grid gap-4 md:grid-cols-3 [&>button]:flex [&>button]:flex-col [&>button]:gap-4 [&>button]:rounded-2xl [&>button]:border [&>button]:border-slate-100 [&>button]:bg-white [&>button]:p-6 [&>button]:text-right [&>button]:shadow-sm [&>button]:transition [&>button]:hover:-translate-y-1 [&>button]:hover:border-blue-200 [&>button]:hover:shadow-lg [&_span]:text-xs [&_span]:text-slate-400 [&_small]:flex [&_small]:items-center [&_small]:gap-1 [&_small]:text-xs [&_small]:text-[#07539b]">
                            {jobs.slice(0, 3).map((j) => (
                                <button
                                    key={j.id}
                                    onClick={() => go("/jobs/" + j.id)}
                                >
                                    <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl border border-slate-100 bg-white">
                                        <Flower />
                                    </div>
                                    <b>{j.title}</b>
                                    <span>
                                        {j.department} · {j.type}
                                    </span>
                                    <small>
                                        مشاهده فرصت <ArrowLeft size={14} />
                                    </small>
                                </button>
                            ))}
                        </div>
                        <button
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-[#07539b] transition hover:border-blue-200 hover:bg-blue-50"
                            onClick={() => go("/jobs")}
                        >
                            مشاهده همه فرصت‌ها <ArrowLeft size={16} />
                        </button>
                    </section>
                </>
            )}
            {isJobs &&
                (path === "/jobs" ? (
                    <JobsBoard
                        jobs={jobs}
                        loading={jobsLoading}
                        error={jobsError}
                        stale={jobsStale}
                        filtered={filtered}
                        query={query}
                        setQuery={setQuery}
                        dept={dept}
                        setDept={setDept}
                        type={type}
                        setType={setType}
                        experience={experience}
                        setExperience={setExperience}
                    />
                ) : (
                    jobsLoading ? <main className="p-20 text-center text-slate-500">در حال دریافت فرصت‌های شغلی...</main> : jobsError ? <main className="p-20 text-center text-slate-500">{jobsError}</main> : <JobDetails
                        job={selected}
                        applied={
                            !!selected &&
                            applications.some((a) => a.job_id === selected.id)
                        }
                        onApply={apply}
                    />
                ))}
            {(isProfile || isApps) && (
                <main className="min-h-[75vh] bg-[#f7f9f9] px-4 pb-20 pt-10 sm:px-6 lg:px-[max(24px,calc((100%-1150px)/2))]">
                    <div className="mb-6 [&_h1]:mb-1 [&_h1]:mt-3 [&_h1]:text-2xl [&_h1]:font-bold [&_p]:text-xs [&_p]:text-slate-400">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[#07539b] [&_span]:h-[3px] [&_span]:w-5 [&_span]:rounded-full [&_span]:bg-[#ffda00]">
                                <span /> پنل کاربری
                            </div>
                            <h1>{isProfile ? "رزومه من" : "درخواست‌های من"}</h1>
                            <p>
                                {isProfile
                                    ? "رزومه خود را تکمیل کنید و فرصت‌های تازه را از دست ندهید."
                                    : "وضعیت درخواست‌های ارسالی خود را پیگیری کنید."}
                            </p>
                        </div>
                    </div>
                    {loaded && !user ? (
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm py-10 text-center text-slate-400 [&_svg]:mx-auto [&_svg]:text-blue-200 [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-700 [&_p]:text-sm [&_p]:leading-7">
                            <p>برای مشاهده این صفحه وارد حساب خود شوید.</p>
                            <button
                                className="inline-flex items-center justify-center gap-4 rounded-xl px-5 py-3.5 text-[13px] font-bold transition mt-5 bg-[#07539b] text-white hover:bg-[#06477f]"
                                onClick={() => setAuth("login")}
                            >
                                ورود / ثبت‌نام
                            </button>
                        </div>
                    ) : isProfile && user ? (
                        <div className="grid items-start gap-6 md:grid-cols-[250px_1fr]">
                            <aside className="md:sticky md:top-5">
                                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hidden p-6 text-center md:block [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-bold [&_p]:text-xs [&_p]:leading-6 [&_p]:text-slate-400 [&_small]:text-xs [&_small]:leading-6 [&_small]:text-slate-400">
                                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eaf4f7] text-[#07539b] mx-auto h-[68px] w-[68px]">
                                        <UserRound size={30} />
                                    </span>
                                    <h3>{user.name}</h3>
                                    <p>
                                        {user.title ||
                                            "عنوان شغلی خود را وارد کنید"}
                                    </p>
                                    <div className="mb-2 mt-5 flex justify-between text-xs [&_span]:text-[#07539b]">
                                        <b>تکمیل رزومه</b>
                                        <span>{fa(completion)}٪</span>
                                    </div>
                                    <progress
                                        value={completion}
                                        max={100}
                                        aria-label="تکمیل رزومه"
                                        className="block h-1.5 w-full appearance-none overflow-hidden rounded-full bg-slate-100 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[#07539b] [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[#07539b]"
                                    />
                                    <small>
                                        با تکمیل اطلاعات، فرصت آشنایی بیشتری با
                                        شما خواهیم داشت.
                                    </small>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mt-3 hidden p-2 md:block [&_a]:flex [&_a]:items-center [&_a]:gap-3 [&_a]:rounded-xl [&_a]:px-3 [&_a]:py-3 [&_a]:text-xs [&_a]:text-slate-500 [&_a]:hover:bg-blue-50 [&_a]:hover:text-[#07539b]">
                                    {profileGroups.map((g) => (
                                        <a href={"#" + g.key} key={g.key}>
                                            {g.icon}
                                            {g.title}
                                        </a>
                                    ))}
                                    <a href="#upload">
                                        <FileText size={19} /> فایل رزومه
                                    </a>
                                </div>
                            </aside>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between rounded-2xl border border-[#e0eef0] bg-[#eaf4f6] p-5 sm:p-6 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-bold [&_p]:text-xs [&_p]:leading-6 [&_p]:text-slate-500 [&>span]:hidden [&>span]:rounded-full [&>span]:bg-white [&>span]:px-3 [&>span]:py-2 [&>span]:text-xs [&>span]:text-[#07539b] [&>span]:sm:block">
                                    <div>
                                        <h2>رزومه خود را کامل کنید</h2>
                                        <p>
                                            اطلاعات شما هنگام ارسال درخواست در
                                            اختیار تیم استخدام قرار می‌گیرد.
                                        </p>
                                    </div>
                                    <span>{fa(completion)}٪ تکمیل شده</span>
                                </div>
                                {profileGroups.map((g) => (
                                    <ResumeSection
                                        key={g.key}
                                        group={g}
                                        user={user}
                                        editing={section === g.key}
                                        draft={draft}
                                        setDraft={setDraft}
                                        onEdit={() => edit(g.key)}
                                        onCancel={() => setSection("")}
                                        onSave={save}
                                        busy={busy}
                                    />
                                ))}
                                <section
                                    id="upload"
                                    className="scroll-mt-4 p-5 sm:p-7 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                                >
                                    <div className="mb-6 flex items-center justify-between gap-3 [&>h2]:flex [&>h2]:items-center [&>h2]:gap-3 [&>h2]:text-base [&>h2]:font-bold [&>h2>span]:grid [&>h2>span]:h-10 [&>h2>span]:w-10 [&>h2>span]:shrink-0 [&>h2>span]:place-items-center [&>h2>span]:rounded-xl [&>h2>span]:bg-[#edf6f8] [&>h2>span]:text-[#07539b]">
                                        <h2>
                                            <span>
                                                <FileText size={19} />
                                            </span>
                                            فایل رزومه
                                        </h2>
                                    </div>
                                    <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#c5dce4] bg-[#f8fbfb] p-5 text-center text-[#07539b] hover:bg-blue-50 [&_b]:break-all [&_b]:text-sm [&_span]:text-xs [&_span]:text-slate-400 [&_input]:sr-only">
                                        <UploadCloud size={30} />
                                        <b>
                                            {user.resume_name ||
                                                "بارگذاری فایل رزومه"}
                                        </b>
                                        <span>فایل PDF، حداکثر ۳ مگابایت</span>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={upload}
                                        />
                                    </label>
                                </section>
                            </div>
                        </div>
                    ) : isApps && user ? (
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm min-h-64">
                            {applications.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 [&_svg]:mx-auto [&_svg]:text-blue-200 [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-700 [&_p]:text-sm [&_p]:leading-7">
                                    <FileText size={36} />
                                    <h3>هنوز درخواستی ثبت نکرده‌اید</h3>
                                    <p>
                                        فرصت‌های شغلی را ببینید و برای موقعیت
                                        دلخواهتان درخواست بفرستید.
                                    </p>
                                    <button
                                        className="inline-flex items-center justify-center gap-4 rounded-xl px-5 py-3.5 text-[13px] font-bold transition mt-5 bg-[#07539b] text-white hover:bg-[#06477f]"
                                        onClick={() => go("/jobs")}
                                    >
                                        مشاهده فرصت‌ها <ArrowLeft size={16} />
                                    </button>
                                </div>
                            ) : (
                                applications.map((a) => {
                                    const j = legacyJobs.find(
                                        (x) => x.id === a.job_id,
                                    );
                                    return (
                                        <div
                                            className="flex items-center gap-4 border-b border-slate-100 py-4 [&_h3]:text-sm [&_h3]:font-bold [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400"
                                            key={a.id}
                                        >
                                            <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl border border-slate-100 bg-white">
                                                <Flower />
                                            </div>
                                            <div>
                                                <h3>
                                                    {a.job_title || j?.title || "فرصت شغلی"}
                                                </h3>
                                                <p>
                                                    شرکت گل‌پخش اول ·{" "}
                                                    {j?.department}
                                                </p>
                                            </div>
                                            <span className="mr-auto flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                                <Clock3 size={15} />
                                                {a.status}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : null}
                </main>
            )}
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
            <ToastContainer
                toastClassName="font-sans!"
                position="bottom-left"
                rtl
                autoClose={4500}
                newestOnTop
                closeOnClick
                pauseOnHover
                theme="light"
            />
        </>
    );
}
