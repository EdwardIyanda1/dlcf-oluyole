import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../api';
import Logo from '../components/Logo';

export default function LandingPage() {
  const [sessions, setSessions] = useState([]);
  const user = JSON.parse(localStorage.getItem('dlcf_user') || 'null');

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        // const res = await apiService.getSessions();
        const res = await apiService.getTodaySessions();
        // Robust data extraction: 
        // 1. If res.data is an array, use it.
        // 2. If res.data has a 'results' key (DRF pagination), use it.
        // 3. Otherwise, default to an empty array.
        const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setSessions(data);
      } catch (err) {
        console.error("Failed to fetch program", err);
        setSessions([]);
      }
    };
    fetchProgram();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1C2541]">
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <g stroke="#D4A857" strokeWidth="1">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI - Math.PI / 2;
              const x2 = 400 + Math.cos(angle) * 600;
              const y2 = 480 + Math.sin(angle) * 600;
              return <line key={i} x1="400" y1="480" x2={x2} y2={y2} />;
            })}
          </g>
          <circle cx="400" cy="480" r="60" fill="#D4A857" opacity="0.3" />
        </svg>

        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
          <div className="flex justify-center mb-10">
            <Logo size={72} light withText={false} />
          </div>
          <p className="text-[#D4A857] text-sm font-semibold tracking-[0.3em] uppercase mb-4">
            Deeper Life Campus Fellowship &mdash; Oluyole Region { new Date().getFullYear() }
          </p>
          <h1
            className="text-5xl md:text-6xl font-bold text-[#FAF6EE] mb-6 leading-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Gather. Worship. <br className="hidden md:block" /> Be Renewed.
          </h1>
          <p className="text-[#FAF6EE]/70 text-lg max-w-xl mx-auto mb-10">
            Already have an account? Check in instantly with your QR code.
            New here? Sign up or fill the registration form &mdash; either way,
            takes a minute.
          </p>

          {user ? (
            <Link
              to="/checkin"
              className="bg-[#D4A857] text-[#1C2541] px-8 py-3 rounded-full font-bold hover:bg-[#e6bd72] transition shadow-lg shadow-[#D4A857]/20"
            >
              Go to Check-In
            </Link>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="bg-[#D4A857] text-[#1C2541] px-8 py-3 rounded-full font-bold hover:bg-[#e6bd72] transition shadow-lg shadow-[#D4A857]/20"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="border border-[#FAF6EE]/30 text-[#FAF6EE] px-8 py-3 rounded-full font-semibold hover:bg-[#FAF6EE]/10 transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="border border-[#FAF6EE]/30 text-[#FAF6EE] px-8 py-3 rounded-full font-semibold hover:bg-[#FAF6EE]/10 transition"
              >
                Fill Registration Form
              </Link>
              <Link
                to="/checkin"
                className="border border-[#FAF6EE]/30 text-[#FAF6EE] px-8 py-3 rounded-full font-semibold hover:bg-[#FAF6EE]/10 transition"
              >
                I Have a Code
              </Link>
            </div>
          )}

          <div className="mt-6">
            <Link to="/admin" className="text-[#FAF6EE]/50 text-sm underline hover:text-[#FAF6EE]">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Program of the day */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-[#6E2C3A] text-sm font-semibold tracking-[0.25em] uppercase text-center mb-2">
          A Day at the Retreat
        </p>
        <h2
          className="text-3xl font-bold text-[#1C2541] text-center mb-12"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          Program of the Day
        </h2>

        <div className="relative">
          <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-gradient-to-r from-[#D4A857] via-[#6E2C3A] to-[#1C2541]" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
            {Array.isArray(sessions) && sessions.length > 0 ? (
              sessions.map((p) => (
                <div key={p.id || p.title} className="text-center">
                  <div className="w-3 h-3 rounded-full bg-[#1C2541] border-4 border-[#FAF6EE] mx-auto mb-4 mt-2 relative z-10" />
                  <p className="text-xs font-semibold text-[#6E2C3A] tracking-widest uppercase mb-1">
                    {p.start_time ? p.start_time.toString().slice(0, 5) : '--:--'}
                  </p>
                  <p className="font-bold text-[#1C2541]">{p.title}</p>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-[#6B7785]">No sessions scheduled for today.</p>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white border-t border-[#1C2541]/10">
        <div className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {['Adult', 'Campus', 'Youth', 'Children'].map((c) => (
            <div key={c} className="border border-[#1C2541]/10 rounded-2xl py-6">
              <p
                className="text-xl font-bold text-[#1C2541]"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                {c}
              </p>
              <p className="text-xs text-[#6B7785] uppercase tracking-widest mt-1">
                Male &amp; Female
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-[#6B7785]">
        &copy; {new Date().getFullYear()} Deeper Life Campus Fellowship, LCU &mdash; Retreat Management System
      </footer>
    </div>
  );
}