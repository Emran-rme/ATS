'use client';
import {useEffect, useId, useRef, useState} from 'react';
import {Check, ChevronDown} from 'lucide-react';

export default function Dropdown({value, onChange, options, placeholder, label, icon: Icon, compact=false}) {
  const [open,setOpen]=useState(false);
  const root=useRef(null), trigger=useRef(null), choices=useRef([]), listId=useId();
  const entries=[{value:'',label:placeholder}, ...options.map(option=>typeof option==='string'?{value:option,label:option}:option)];
  useEffect(()=>{if(!open)return;const outside=e=>{if(!root.current?.contains(e.target))setOpen(false)};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[open]);
  const choose=entry=>{onChange(entry.value);setOpen(false);trigger.current?.focus()};
  const focusAt=index=>choices.current[Math.max(0,Math.min(entries.length-1,index))]?.focus();
  const keyDown=(e,index)=>{if(e.key==='Escape'){e.preventDefault();setOpen(false);trigger.current?.focus()}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!open){setOpen(true);requestAnimationFrame(()=>focusAt(Math.max(0,entries.findIndex(x=>x.value===value))))}else focusAt(index+(e.key==='ArrowDown'?1:-1))}else if(e.key==='Home'&&open){e.preventDefault();focusAt(0)}else if(e.key==='End'&&open){e.preventDefault();focusAt(entries.length-1)}};
  return <div ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}} className={'relative min-w-0 '+(compact?'inline-block':'w-full')} onKeyDown={e=>{if(e.key==='Escape'&&open){e.preventDefault();setOpen(false);trigger.current?.focus()}}}>
    <button ref={trigger} type="button" aria-label={label||placeholder} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} onKeyDown={e=>keyDown(e,-1)} onClick={()=>setOpen(!open)} className={'flex w-full items-center gap-2 rounded-xl border bg-white text-right text-[13px] text-slate-700 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07539b] '+(compact?'min-h-10 border-slate-200 px-4':'min-h-[50px] border-slate-200 px-4')+(open?' border-[#07539b] ring-4 ring-blue-50':' hover:border-slate-300')}>
      {Icon&&<Icon size={17} className="shrink-0 text-[#7791a3]"/>}<span className={'min-w-0 flex-1 truncate '+(!value?'text-slate-500':'')}>{entries.find(x=>x.value===value)?.label||placeholder}</span><ChevronDown size={16} className={'shrink-0 text-slate-400 transition-transform '+(open?'rotate-180':'')}/>
    </button>
    {open&&<div id={listId} role="listbox" aria-label={label||placeholder} className="absolute right-0 top-[calc(100%+6px)] z-40 max-h-64 w-full min-w-48 overflow-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_15px_40px_rgba(18,48,70,.15)]">{entries.map((entry,index)=><button key={entry.value||'empty'} ref={el=>{choices.current[index]=el}} type="button" role="option" aria-selected={value===entry.value} tabIndex={-1} onKeyDown={e=>keyDown(e,index)} onClick={()=>choose(entry)} className={'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right text-[13px] outline-none transition hover:bg-slate-50 focus:bg-blue-50 '+(value===entry.value?'bg-blue-50 font-bold text-[#07539b]':'text-slate-600')}><span className="flex-1">{entry.label}</span>{value===entry.value&&<Check size={15}/>}</button>)}</div>}
  </div>;
}
