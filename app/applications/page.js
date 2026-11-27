"use client";
import { ArrowLeft, Clock3, FileText } from "lucide-react";
import { jobs as legacyJobs } from "../../lib/jobs";
import Career, { Flower, useCareer } from "../career";
import AccountPage from "../account-page";
function Applications() {
    const { applications, go } = useCareer();
    return <AccountPage title="درخواست‌های من" description="وضعیت درخواست‌های ارسالی خود را پیگیری کنید.">
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
                                                {a.sync_status === 'pending' && <p>در انتظار ارسال به شیرپوینت</p>}
                                                {a.sync_status === 'sent' && <p>ارسال به شیرپوینت انجام شد</p>}
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
    </AccountPage>;
}
export default function Page() { return <Career><Applications /></Career>; }
