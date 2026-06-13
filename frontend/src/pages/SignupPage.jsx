import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../api';
import Logo from '../components/Logo';

const inputClass =
  'w-full border border-[#1C2541]/15 bg-[#FAF6EE] focus:bg-white p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#D4A857] transition';

export default function SignupPage() {
  const [form, setForm] = useState({
    full_name: '', school: '', phone_number: '', address: '', sex: 'M', category: 'Adult',
    email: '', password: '',
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await apiService.signup(form);
    localStorage.setItem('dlcf_token', res.data.token);
    localStorage.setItem('dlcf_user', JSON.stringify(res.data.user));
    navigate('/checkin');
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] py-12 px-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={56} withText={false} />
          </div>
          <p className="text-[#6E2C3A] text-sm font-semibold tracking-[0.25em] uppercase mb-2">
            Create Your Account
          </p>
          <h1
            className="text-3xl font-bold text-[#1C2541]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Sign Up Once, Check In Forever
          </h1>
          <p className="text-[#6B7785] mt-2">
            Fill this in like a normal registration &mdash; we'll also set up
            your login so future check-ins are instant.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-[#1C2541]/10"
        >
          <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            className={inputClass}
            placeholder="e.g. Ade Johnson"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />

          <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
            School / Institution
          </label>
          <input
            className={inputClass}
            placeholder="e.g. Lead City University"
            value={form.school}
            onChange={(e) => setForm({ ...form, school: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                className={inputClass}
                placeholder="080..."
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
                Sex
              </label>
              <select
                className={inputClass}
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
            Home Address
          </label>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Street, city, state"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {['Adult', 'Campus', 'Youth', 'Children'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Account credentials */}
          <div className="border-t border-[#1C2541]/10 mt-2 pt-6 mb-2">
            <p className="text-xs font-semibold text-[#6E2C3A] uppercase tracking-wider mb-4">
              Account Details
            </p>

            <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              className={inputClass}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              className={inputClass}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button className="w-full bg-[#1C2541] text-[#FAF6EE] py-3 rounded-lg font-bold hover:bg-[#2a3a63] transition mt-2">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7785] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#6E2C3A] font-semibold underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}