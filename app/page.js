"use client";
import { ArrowLeft } from "lucide-react";
import Career, { Flower, useCareer } from "./career";
function Home() {
    const { jobs, go, protectedGo } = useCareer();
    return (
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
    );
}
export default function Page() { return <Career><Home /></Career>; }
