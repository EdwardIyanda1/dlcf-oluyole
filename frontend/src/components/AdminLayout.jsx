// src/components/AdminLayout.jsx
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const loc = useLocation();
  const nav = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/programs', label: 'Programs & Attendance' },
    { path: '/admin/participants', label: 'All Registered' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex">
      <aside className="w-64 bg-[#1C2541] p-6 flex flex-col">
        <h2 className="text-[#D4A857] font-bold text-lg mb-8">Admin Panel</h2>
        <nav className="flex flex-col gap-2">
          {nav.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`p-3 rounded-lg font-semibold ${
                loc.pathname === item.path ? 'bg-[#D4A857] text-[#1C2541]' : 'text-[#FAF6EE] hover:bg-[#FAF6EE]/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}