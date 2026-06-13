import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Logo from './Logo';

export default function Header() {
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const link = (to, label) => (
    <Link
      to={to}
      onClick={() => setIsMenuOpen(false)}
      className={`text-sm font-semibold tracking-wide transition-colors ${
        pathname === to ? 'text-[#D4A857]' : 'text-[#FAF6EE]/70 hover:text-[#FAF6EE]'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-[#1C2541] border-b border-[#D4A857]/20 relative z-50">
      {/* ToastContainer placed here so it loads with the header */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" onClick={() => setIsMenuOpen(false)}>
          <Logo size={40} light />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {link('/', 'Home')}
          {link('/register', 'Register')}
          {link('/admin', 'Admin')}
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-[#FAF6EE] text-2xl"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Nav Overlay with Glassmorphism */}
      {isMenuOpen && (
        <nav className="md:hidden absolute top-full left-0 w-full bg-[#1C2541]/80 backdrop-blur-md border-b border-[#D4A857]/20 flex flex-col items-center gap-6 py-8 shadow-xl">
          {link('/', 'Home')}
          {link('/register', 'Register')}
          {link('/admin', 'Admin')}
        </nav>
      )}
    </header>
  );
}