import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1C2541] border-t border-[#D4A857]/20">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <Link to="/">
          <Logo size={36} light />
        </Link>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#FAF6EE]/60">
          <Link to="/" className="hover:text-[#FAF6EE] transition">Home</Link>
          <Link to="/register" className="hover:text-[#FAF6EE] transition">Register</Link>
          <Link to="/checkin" className="hover:text-[#FAF6EE] transition">Check In</Link>
          <Link to="/privacy" className="hover:text-[#FAF6EE] transition">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-[#FAF6EE] transition">Terms &amp; Conditions</Link>
        </nav>
      </div>
      <div className="border-t border-[#FAF6EE]/10 py-4 text-center text-xs text-[#FAF6EE]/40">
        &copy; {year} Deeper Life Campus Fellowship, Oluyole Region. All rights reserved.
      </div>
    </footer>
  );
}
