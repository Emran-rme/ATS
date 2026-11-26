"use client";
import { useParams } from "next/navigation";
import Career, { useCareer } from "../../career";
import { JobDetails } from "../../job-board";
function Job() {
    const { id } = useParams();
    const { jobs, jobsLoading, jobsError, applications, apply } = useCareer();
    const selected = jobs.find(job => String(job.id) === id);
    if (jobsLoading) return <main className="p-20 text-center text-slate-500">در حال دریافت فرصت‌های شغلی...</main>;
    if (jobsError) return <main className="p-20 text-center text-slate-500">{jobsError}</main>;
    return <JobDetails job={selected} applied={!!selected && applications.some(item => item.job_id === selected.id)} onApply={apply} />;
}
export default function Page() { return <Career><Job /></Career>; }
