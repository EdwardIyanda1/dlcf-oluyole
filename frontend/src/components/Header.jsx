import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

export default function Header() {
  const { pathname } = useLocation();

  const link = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-semibold tracking-wide transition-colors ${
        pathname === to ? 'text-[#D4A857]' : 'text-[#FAF6EE]/70 hover:text-[#FAF6EE]'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-[#1C2541] border-b border-[#D4A857]/20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/">
          <Logo size={40} light />
        </Link>
        <nav className="flex items-center gap-8">
          {link('/', 'Home')}
          {link('/register', 'Register')}
          {link('/admin', 'Admin')}
        </nav>
      </div>
    </header>
  );
}