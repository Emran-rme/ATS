import ReactMarkdown from 'react-markdown';

const components = {
  h1: ({children}) => <h3 className="mt-6 text-lg font-bold text-[#173653]">{children}</h3>,
  h2: ({children}) => <h3 className="mt-6 text-base font-bold text-[#173653]">{children}</h3>,
  h3: ({children}) => <h4 className="mt-5 font-bold text-[#173653]">{children}</h4>,
  p: ({children}) => <p className="mt-3 whitespace-pre-line">{children}</p>,
  ul: ({children}) => <ul className="my-3 list-disc space-y-1 pr-6">{children}</ul>,
  ol: ({children}) => <ol className="my-3 list-decimal space-y-1 pr-6">{children}</ol>,
  a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#07539b] underline">{children}</a>,
};

export default function JobDescription({text}) {
  return <div className="mt-6 break-words text-sm leading-8 text-slate-600"><ReactMarkdown components={components} skipHtml>{text || 'شرح این فرصت ثبت نشده است.'}</ReactMarkdown></div>;
}

export function jobSummary(text = '') {
  return text.replace(/^ {0,3}#{1,6}\s+/gm, '').replace(/^\s*[-*+]\s+/gm, '').replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/(\*\*|__|\*|_)/g, '').replace(/\s+/g, ' ').trim();
}
