import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo from './Logo';
import MenuIcon from './MenuIcon';
import {
  IconOverview, IconPrograms, IconAttendance,
  IconReports, IconParticipants, IconMessaging, IconArrowLeft,
} from './icons';

const NAV = [
  { path: '/admin',              label: 'Overview',       Icon: IconOverview },
  { path: '/admin/programs',     label: 'Programs',       Icon: IconPrograms },
  { path: '/admin/attendance',   label: 'Attendance',     Icon: IconAttendance },
  { path: '/admin/reports',      label: 'Reports',        Icon: IconReports },
  { path: '/admin/participants', label: 'All Registered', Icon: IconParticipants },
  { path: '/admin/messaging',    label: 'Messaging',      Icon: IconMessaging },
];

export default function AdminLayout() {
  const loc    = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (path) =>
    path === '/admin' ? loc.pathname === '/admin' : loc.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col md:flex-row">

      {/* Mobile top bar */}
      <div className="md:hidden bg-[#1C2541] px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Logo size={28} light withText={false} />
          <span className="font-bold text-[#D4A857] text-sm tracking-wide">Admin Panel</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-[#FAF6EE] p-1"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <MenuIcon open={open} />
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
              <item.Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 hidden md:block border-t border-[#FAF6EE]/10">
          <Link
            to="/"
            className="flex items-center gap-2 text-[#FAF6EE]/40 text-xs hover:text-[#FAF6EE]/70 transition px-3"
          >
            <IconArrowLeft className="w-3.5 h-3.5" />
            Back to site
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}