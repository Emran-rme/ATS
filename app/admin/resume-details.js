import { Award, BriefcaseBusiness, GraduationCap, Languages, Sparkles, UserRound } from 'lucide-react';
import { withResumeCollections } from '../../lib/resume';

function Section({ icon: Icon, title, children }) {
  return <section className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#07539b]"><Icon size={18}/></span>
      <h4 className="text-sm font-bold text-[#18344c]">{title}</h4>
    </div>
    {children}
  </section>;
}

function Empty() {
  return <p className="text-xs leading-6 text-slate-400">اطلاعاتی ثبت نشده است.</p>;
}

function Text({ children, className = '' }) {
  return <p className={'whitespace-pre-wrap break-words text-sm leading-7 text-slate-600 ' + className}>{children}</p>;
}

function Period({ start, end, date }) {
  if (!start && !end && !date) return null;
  return <p className="mt-2 text-xs leading-6 text-slate-400">{date || <>{start || 'تاریخ شروع ثبت نشده'} <span className="mx-1">تا</span> {end || 'تاریخ پایان ثبت نشده'}</>}</p>;
}

function Entries({ items, render }) {
  return items.length ? <div className="space-y-4 divide-y divide-slate-100">{items.map((item, index) => <div key={index} className={index ? 'pt-4' : ''}>{render(item)}</div>)}</div> : <Empty/>;
}

export default function ResumeDetails({ applicant, id }) {
  const data = withResumeCollections(applicant);
  const experience = data.experience_items.filter(item => item && Object.values(item).some(Boolean));
  const education = data.education_items.filter(item => item && Object.values(item).some(Boolean));
  const skills = data.skill_items.filter(item => item && Object.values(item).some(Boolean));
  const certificates = data.certificate_items.filter(item => item && Object.values(item).some(Boolean));
  const basic = [['عنوان شغلی', data.title], ['محل سکونت', data.address], ['تاریخ تولد', data.birthdate], ['جنسیت', data.gender], ['وضعیت تأهل', data.marital], ['وضعیت نظام وظیفه', data.military], ['حقوق درخواستی', data.salary]].filter(([, value]) => typeof value === 'string' && value.trim());

  return <div id={id} className="mt-5 rounded-2xl border border-slate-100 bg-[#f6f9fb] p-4 sm:p-6">
    <div className="mb-5 flex items-center gap-3">
      <span className="h-6 w-1 rounded-full bg-[#ffda00]"/>
      <div><h3 className="text-base font-bold text-[#18344c]">رزومه {applicant.name}</h3><p className="mt-1 text-xs leading-6 text-slate-500">اطلاعات ثبت‌شده توسط کارجو</p></div>
    </div>
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <Section icon={UserRound} title="معرفی و اطلاعات فردی">
          {basic.length > 0 && <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{basic.map(([label, value]) => <div key={label} className="min-w-0"><dt className="mb-1 text-xs text-slate-400">{label}</dt><dd className="break-words text-sm leading-6 text-slate-700">{value}</dd></div>)}</dl>}
          {data.about && <div className={basic.length ? 'mt-4 border-t border-slate-100 pt-4' : ''}><p className="mb-1 text-xs text-slate-400">درباره کارجو</p><Text>{data.about}</Text></div>}
          {!basic.length && !data.about && <Empty/>}
        </Section>
        <Section icon={BriefcaseBusiness} title="سوابق شغلی">
          <Entries items={experience} render={item => <><p className="break-words text-sm font-bold text-slate-700">{item.role || item.company || 'سابقه شغلی'}</p>{item.role && item.company && <p className="mt-1 text-xs text-slate-500">{item.company}</p>}<Period start={item.start} end={item.end}/>{item.description && <Text className="mt-2">{item.description}</Text>}</>}/>
        </Section>
        <Section icon={GraduationCap} title="تحصیلات">
          <Entries items={education} render={item => <><p className="break-words text-sm font-bold text-slate-700">{[item.degree, item.field].filter(Boolean).join(' · ') || item.institution || 'سابقه تحصیلی'}</p>{item.institution && (item.degree || item.field) && <p className="mt-1 text-xs text-slate-500">{item.institution}</p>}<Period start={item.start} end={item.end}/>{item.description && <Text className="mt-2">{item.description}</Text>}</>}/>
        </Section>
      </div>
      <div className="space-y-4">
        <Section icon={Sparkles} title="مهارت‌ها">
          {skills.length ? <div className="flex flex-wrap gap-2">{skills.map((item, index) => <div key={index} className="flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-[#07539b]"><span className="break-words font-bold">{item.name || 'مهارت'}</span>{item.level && <span className="border-r border-blue-200 pr-2 text-slate-500">{item.level}</span>}</div>)}</div> : <Empty/>}
        </Section>
        <Section icon={Award} title="دوره‌ها و مدارک">
          <Entries items={certificates} render={item => <><p className="break-words text-sm font-bold text-slate-700">{item.name || item.issuer || 'دوره یا مدرک'}</p>{item.name && item.issuer && <p className="mt-1 text-xs text-slate-500">{item.issuer}</p>}<Period date={item.date}/>{item.description && <Text className="mt-2">{item.description}</Text>}</>}/>
        </Section>
        <Section icon={Languages} title="زبان‌ها">
          {data.languages ? <Text>{data.languages}</Text> : <Empty/>}
        </Section>
      </div>
    </div>
  </div>;
}
