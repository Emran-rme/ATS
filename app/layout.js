import localFont from 'next/font/local';
import './globals.css';
const kalameh = localFont({src:'./fonts/KalamehWeb-Regular.woff2',display:'swap',variable:'--font-kalameh'});
export const metadata = { title:'فرصت‌های شغلی | گل‌پخش اول', description:'به خانواده گل‌پخش اول بپیوندید.' };
export default function RootLayout({children}) { return <html lang="fa" dir="rtl" className={`${kalameh.variable} scroll-smooth`}><body className="bg-[#fbfcfc] font-sans text-[15px] leading-relaxed text-[#1c3347] [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-60 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[#07539b] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-[#07539b]">{children}</body></html>; }
