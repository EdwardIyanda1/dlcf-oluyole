import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo from './Logo';

export default function AdminLayout() {
  const loc = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const nav = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/programs', label: 'Programs' },
    { path: '/admin/attendance', label: 'Attendance' },
    { path: '/admin/participants', label: 'All Registered' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col md:flex-row">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>

      {/* Mobile Toggle Button */}
      <div className="md:hidden bg-[#1C2541] p-4 flex justify-between items-center text-[#FAF6EE]">
        <div className="flex items-center gap-2">
          <Logo size={24} light withText={false} />
          <span className="font-bold text-[#D4A857] tracking-wide">Admin Panel</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-xl">
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`${isOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-[#1C2541] p-6 flex flex-col min-h-screen flex-shrink-0`}>
        <div className="hidden md:flex items-center mb-10">
          <Logo size={40} light withText={true} />
        </div>

        <p className="hidden md:block text-[#D4A857] text-xs font-semibold tracking-[0.25em] uppercase mb-3 px-3">
          Admin Panel
        </p>

        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                loc.pathname === item.path
                  ? 'bg-[#D4A857] text-[#1C2541]'
                  : 'text-[#FAF6EE]/70 hover:bg-[#FAF6EE]/10 hover:text-[#FAF6EE]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 hidden md:block">
          <Link to="/" className="text-[#FAF6EE]/40 text-xs hover:text-[#FAF6EE]/70 transition">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}