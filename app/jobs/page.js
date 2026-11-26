"use client";
import { useState } from "react";
import Career, { useCareer } from "../career";
import { JobsBoard } from "../job-board";
function Jobs() {
    const { jobs, jobsLoading, jobsError, jobsStale } = useCareer();
    const [query, setQuery] = useState(""), [dept, setDept] = useState(""), [type, setType] = useState(""), [experience, setExperience] = useState("");
    const filtered = jobs.filter(j => (!dept || j.department === dept) && (!type || j.type === type) && (!experience || j.experience === experience) && `${j.title} ${j.department}`.includes(query.trim()));
    return <JobsBoard jobs={jobs} loading={jobsLoading} error={jobsError} stale={jobsStale} filtered={filtered} query={query} setQuery={setQuery} dept={dept} setDept={setDept} type={type} setType={setType} experience={experience} setExperience={setExperience} />;
}
export default function Page() { return <Career><Jobs /></Career>; }
