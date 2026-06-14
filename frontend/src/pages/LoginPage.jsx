import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService, { auth } from '../api';
import Logo from '../components/Logo';

const inputClass =
  'w-full border border-[#1C2541]/15 bg-[#FAF6EE] focus:bg-white p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#D4A857] transition';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // apiService.login() calls auth.setToken() and auth.setUser() internally
      await apiService.login({ email: form.email, password: form.password });
      toast.success("Login successful!");
      navigate('/checkin');
    } catch (err) {
      toast.error("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={56} withText={false} />
          </div>
          <h1
            className="text-3xl font-bold text-[#1C2541]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Welcome Back
          </h1>
          <p className="text-[#6B7785] mt-2">
            Sign in to check in with your QR code or unique code.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#1C2541]/10">
          <form onSubmit={handleSubmit}>
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

            <button 
              disabled={loading} 
              className={`w-full py-3 rounded-lg font-bold transition ${
                loading ? 'bg-gray-400' : 'bg-[#1C2541] text-[#FAF6EE] hover:bg-[#2a3a63]'
              }`}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B7785] mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#6E2C3A] font-semibold underline">
            Sign up
          </Link>
        </p>
        <p className="text-center text-sm text-[#6B7785] mt-2">
          Prefer not to create an account?{' '}
          <Link to="/register" className="text-[#6E2C3A] font-semibold underline">
            Fill the registration form instead
          </Link>
        </p>
      </div>
    </div>
  );
}