import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService from '../api';
import Logo from '../components/Logo';

const inputClass =
  'w-full border border-[#1C2541]/15 bg-[#FAF6EE] focus:bg-white p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#D4A857] transition';

const EMPTY_FORM = (retreatCode = '') => ({
  full_name: '', school: '', phone_number: '', address: '',
  sex: 'M', category: 'Adult', retreat_code: retreatCode,
});

export default function RegistrationPage() {
  // Read ?retreat_code=DLCF-XXX from the QR scan URL — falls back to ''
  const [searchParams] = useSearchParams();
  const retreatCode = searchParams.get('retreat_code') || '';

  const [formData, setFormData] = useState(EMPTY_FORM(retreatCode));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.postParticipant(formData);
      toast.success("Registration successful! We can't wait to see you.");
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : "Failed to register. Please check your information and try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData(EMPTY_FORM(retreatCode)); // preserve retreat_code on reset
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-6">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <Logo size={64} withText={false} />
          </div>
          <h2
            className="text-3xl font-bold text-[#1C2541] mb-3"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            You're In, {formData.full_name.split(' ')[0] || 'Friend'}!
          </h2>
          <p className="text-[#6B7785] mb-8">
            Your spot for the retreat is confirmed. We can't wait to worship and
            grow with you.
          </p>
          <button onClick={handleReset} className="text-[#6E2C3A] font-semibold underline">
            Register another participant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] py-12 px-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={56} withText={false} />
          </div>
          <p className="text-[#6E2C3A] text-sm font-semibold tracking-[0.25em] uppercase mb-2">
            Retreat Registration
          </p>
          <h1
            className="text-3xl font-bold text-[#1C2541]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Reserve Your Place
          </h1>
          {retreatCode && (
            <p className="text-xs text-[#6B7785] mt-2 font-mono">
              Retreat: <span className="font-bold text-[#1C2541]">{retreatCode}</span>
            </p>
          )}
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
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
            School / Institution
          </label>
          <input
            className={inputClass}
            placeholder="e.g. Lead City University"
            value={formData.school}
            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
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
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
                Sex
              </label>
              <select
                className={inputClass}
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
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
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            className={inputClass}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {['Adult', 'Campus', 'Youth', 'Children'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold transition mt-2 ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1C2541] text-[#FAF6EE] hover:bg-[#2a3a63]'
            }`}
          >
            {loading ? 'Submitting...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}