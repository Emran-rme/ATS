'use client';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Dropdown from './dropdown';
import PersianDateField from './persian-date-field';

const inputStyle = 'w-full rounded-xl border border-slate-200 bg-[#fbfcfc] px-4 py-3 text-[13px] font-normal text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#7eb1cb] focus:bg-white focus:ring-4 focus:ring-blue-50';
const labelStyle = 'flex min-w-0 flex-col gap-2 text-[13px] font-bold text-slate-500';
const addStyle = 'mt-4 inline-flex items-center gap-2 rounded-lg border border-[#e2eff3] bg-[#f0f7f9] px-3 py-2.5 text-xs font-bold text-[#07539b] hover:bg-[#e4f2f6]';
const saveStyle = 'mt-5 inline-flex items-center justify-center gap-4 rounded-xl bg-[#07539b] px-5 py-3.5 text-[13px] font-bold text-white transition hover:bg-[#06477f]';

function Field({field, value, onChange}) {
  const [key, label, kind] = field;
  if (['birthdate','start','end','date'].includes(key)) return <div className={labelStyle}><span>{label}</span><PersianDateField label={label} value={value || ''} onChange={onChange}/></div>;
  if (Array.isArray(kind)) return <div className={labelStyle}><span>{label}</span><Dropdown label={label} value={value || ''} onChange={onChange} options={kind} placeholder="انتخاب کنید"/></div>;
  return <label className={labelStyle + (kind === true ? ' sm:col-span-2' : '')}>{label}{kind === true ? <textarea rows="3" className={inputStyle + ' min-h-24 resize-y'} value={value || ''} onChange={e=>onChange(e.target.value)} placeholder={label+' را وارد کنید'}/> : <input className={inputStyle} value={value || ''} onChange={e=>onChange(e.target.value)} placeholder={label+' را وارد کنید'}/>}</label>;
}

export default function ResumeSection({group, user, editing, draft, setDraft, onEdit, onCancel, onSave, busy}) {
  const items = group.collection ? (user[group.collection] || []) : [];
  const editingItems = group.collection ? (draft[group.collection] || []) : [];
  const addItem = () => setDraft({...draft, [group.collection]: [...editingItems, {}]});
  const updateItem = (index, key, value) => setDraft({...draft, [group.collection]: editingItems.map((item, i) => i === index ? {...item, [key]:value} : item)});
  const removeItem = index => setDraft({...draft, [group.collection]: editingItems.filter((_, i) => i !== index)});
  return <section className="scroll-mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7" id={group.key}>
    <div className="mb-6 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf6f8] text-[#07539b]">{group.icon}</span><div><h2 className="text-base font-bold">{group.title}</h2><p className="mt-1 text-xs text-slate-400">{group.subtitle}</p></div></div><button type="button" className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-[#52758b] hover:bg-blue-50" onClick={editing ? onCancel : onEdit}><Pencil size={15}/>{editing ? 'بستن' : 'ویرایش'}</button></div>
    {editing ? <form onSubmit={onSave}>
      {group.collection ? <>
        <div className="grid gap-3">{editingItems.map((item,index)=><div className="rounded-xl border border-slate-100 bg-[#f8fafb] p-4 sm:p-5" key={index}>
          <div className="mb-5 flex items-center justify-between text-xs text-slate-600"><b>{group.itemLabel} {new Intl.NumberFormat('fa-IR').format(index+1)}</b><button type="button" className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-600" onClick={()=>removeItem(index)} aria-label={'حذف '+group.itemLabel}><Trash2 size={15}/> حذف</button></div>
          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">{group.fields.map(field=><Field key={field[0]} field={field} value={item[field[0]]} onChange={value=>updateItem(index,field[0],value)}/>)}</div>
        </div>)}</div>
        {editingItems.length===0&&<p className="mt-1 text-xs text-slate-400">هنوز موردی اضافه نکرده‌اید.</p>}
        <button className={addStyle} type="button" onClick={addItem} disabled={editingItems.length>=50}><Plus size={17}/> افزودن {group.itemLabel}</button>
      </> : <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">{group.fields.map(field=><Field key={field[0]} field={field} value={draft[field[0]]} onChange={value=>setDraft({...draft,[field[0]]:value})}/>)}</div>}
      <div className="flex items-center gap-4"><button className={saveStyle} disabled={busy}>ذخیره تغییرات</button><button type="button" className="mt-5 text-xs text-slate-400" onClick={onCancel}>انصراف</button></div>
    </form> : group.collection ? <>
      {items.length ? <div>{items.map((item,index)=><article className="flex gap-4 border-t border-slate-100 py-4 first:border-0 first:pt-0" key={index}><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400 ring-4 ring-yellow-50"/><div className="grid flex-1 gap-3 sm:grid-cols-2">{group.fields.filter(([key])=>item[key]).map(([key,label])=><div key={key}><span className="block whitespace-pre-wrap break-words text-xs leading-6 text-slate-400">{label}</span><b className="block whitespace-pre-wrap break-words text-xs font-semibold leading-6 text-slate-600">{item[key]}</b></div>)}</div></article>)}</div> : <p className="mt-1 text-xs text-slate-400">هنوز {group.itemLabel} اضافه نشده است.</p>}
      <button type="button" className={addStyle} onClick={onEdit}><Plus size={17}/> افزودن {group.itemLabel}</button>
    </> : <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">{group.fields.map(([key,label])=><div key={key}><span className="mb-1 block whitespace-pre-wrap text-[13px] leading-6 text-slate-400">{label}</span><b className="block whitespace-pre-wrap text-[13px] leading-6">{user[key]||'وارد نشده'}</b></div>)}</div>}
  </section>;
}
