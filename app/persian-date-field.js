'use client';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persianFa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import { CalendarDays, X } from 'lucide-react';

function calendarValue(value) {
  if (!value) return null;
  const digits = String(value).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const match = digits.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new DateObject({year, month, day, calendar: year >= 1700 ? gregorian : persian});
  return date.isValid ? date.convert(persian, persianFa) : null;
}

export default function PersianDateField({value, onChange, label}) {
  return <div className="relative flex w-full items-center gap-2 [&_.rmdp-wrapper]:z-40! [&_.rmdp-wrapper]:rounded-[14px]! [&_.rmdp-wrapper]:border! [&_.rmdp-wrapper]:border-slate-200! [&_.rmdp-wrapper]:font-sans! [&_.rmdp-wrapper]:shadow-[0_15px_40px_rgba(18,48,70,.15)]! [&_.rmdp-day.rmdp-selected_span:not(.highlight)]:bg-[#07539b]! [&_.rmdp-day.rmdp-selected_span:not(.highlight)]:shadow-none! [&_.rmdp-day.rmdp-today_span]:bg-[#eaf4f7]! [&_.rmdp-day.rmdp-today_span]:text-[#07539b]! [&_.rmdp-day:not(.rmdp-disabled):not(.rmdp-day-hidden)_span:hover]:bg-[#07539b]! [&_.rmdp-arrow]:border-[#07539b]! [&_.rmdp-arrow-container:hover]:bg-[#07539b]! [&_.rmdp-arrow-container:hover]:shadow-none!">
    <DatePicker
      value={calendarValue(value)}
      onChange={date => onChange(date?.isValid ? date.format('YYYY/MM/DD') : '')}
      calendar={persian}
      locale={persianFa}
      format="YYYY/MM/DD"
      calendarPosition="bottom-right"
      containerClassName="w-full"
      render={(_, openCalendar) => <button type="button" onClick={openCalendar} aria-label={label} className="flex min-h-[48px] w-full items-center gap-3 rounded-xl border border-slate-200 bg-[#fbfcfc] px-4 py-3 text-right text-[13px] font-normal text-slate-700 transition hover:border-slate-300 focus-visible:border-[#7eb1cb] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-50"><CalendarDays size={17} className="shrink-0 text-[#7791a3]"/><span className={'min-w-0 flex-1 truncate '+(!value ? 'text-slate-400' : '')}>{value || 'انتخاب تاریخ شمسی'}</span></button>}
    />
    {value && <button type="button" aria-label={'پاک کردن '+label} title={'پاک کردن '+label} onClick={()=>onChange('')} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-[#07539b]"><X size={16}/></button>}
  </div>;
}
