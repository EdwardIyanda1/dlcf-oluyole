import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo from './Logo';

const NAV = [
  { path: '/admin',              label: 'Overview',      icon: '◈' },
  { path: '/admin/programs',     label: 'Programs',      icon: '◉' },
  { path: '/admin/attendance',   label: 'Attendance',    icon: '◎' },
  { path: '/admin/reports',      label: 'Reports',       icon: '◐' },
  { path: '/admin/participants', label: 'All Registered',icon: '◍' },
  { path: '/admin/messaging',    label: 'Messaging',     icon: '✉' },
];

export default function AdminLayout() {
  const loc    = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (path) =>
    path === '/admin' ? loc.pathname === '/admin' : loc.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col md:flex-row">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>

      {/* Mobile top bar */}
      <div className="md:hidden bg-[#1C2541] px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Logo size={28} light withText={false} />
          <span className="font-bold text-[#D4A857] text-sm tracking-wide">Admin Panel</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-[#FAF6EE] text-xl">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${open ? 'block' : 'hidden'} md:flex flex-col w-full md:w-60 bg-[#1C2541] min-h-screen flex-shrink-0 p-5`}>
        <div className="hidden md:flex items-center mb-8">
          <Logo size={40} light withText />
        </div>
        <p className="hidden md:block text-[#D4A857]/60 text-[10px] font-bold tracking-[0.3em] uppercase mb-3 px-3">
          Navigation
        </p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isActive(item.path)
                  ? 'bg-[#D4A857] text-[#1C2541]'
                  : 'text-[#FAF6EE]/60 hover:bg-[#FAF6EE]/10 hover:text-[#FAF6EE]'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 hidden md:block border-t border-[#FAF6EE]/10">
          <Link to="/" className="text-[#FAF6EE]/30 text-xs hover:text-[#FAF6EE]/60 transition">
            ← Back to site
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}