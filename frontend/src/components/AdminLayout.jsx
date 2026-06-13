import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo from './Logo';

export default function AdminLayout() {
  const loc = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const nav = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/programs', label: 'Programs & Attendance' },
    { path: '/admin/participants', label: 'All Registered' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col md:flex-row">
      {/* Mobile Toggle Button */}
      <div className="md:hidden bg-[#1C2541] p-4 flex justify-between items-center text-[#FAF6EE]">
        <div className="flex items-center gap-2">
            <Logo size={24} light withText={false} />
            <span className="font-bold text-[#D4A857]">Admin Panel</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-xl">
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`${isOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-[#1C2541] p-6 flex flex-col min-h-screen`}>
        {/* Logo Section */}
        <div className="hidden md:flex items-center mb-10">
            <Logo size={40} light withText={true} />
        </div>
        
        <nav className="flex flex-col gap-2">
          {nav.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => setIsOpen(false)} // Close menu on mobile click
              className={`p-3 rounded-lg font-semibold transition-colors ${
                loc.pathname === item.path 
                  ? 'bg-[#D4A857] text-[#1C2541]' 
                  : 'text-[#FAF6EE] hover:bg-[#FAF6EE]/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}