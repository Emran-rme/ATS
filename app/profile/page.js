"use client";
import { useState } from "react";
import { BriefcaseBusiness, Check, FileText, GraduationCap, UploadCloud, UserRound } from "lucide-react";
import { toast } from "react-toastify";
import { withResumeCollections } from "../../lib/resume";
import Career, { api, useCareer } from "../career";
import AccountPage from "../account-page";
import ResumeSection from "../resume-section";
const fa = n => new Intl.NumberFormat("fa-IR").format(n);
function Profile() {
    const { user, setUser } = useCareer();
    const [section, setSection] = useState(""), [draft, setDraft] = useState({}), [busy, setBusy] = useState(false);
    const enrich = withResumeCollections, notify = text => toast.success(text);
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
    if (!user) return <AccountPage title="رزومه من" description="رزومه خود را تکمیل کنید و فرصت‌های تازه را از دست ندهید." />;
    return <AccountPage title="رزومه من" description="رزومه خود را تکمیل کنید و فرصت‌های تازه را از دست ندهید.">
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
    </AccountPage>;
}
export default function Page() { return <Career><Profile /></Career>; }
