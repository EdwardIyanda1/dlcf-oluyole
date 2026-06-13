import { useState } from 'react';
import { toast } from 'react-toastify';
import apiService from '../api';
import Logo from '../components/Logo';

const inputClass =
  'w-full border border-[#1C2541]/15 bg-[#FAF6EE] focus:bg-white p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#D4A857] transition';

export default function RegistrationPage() {
  const [formData, setFormData] = useState({
    full_name: '', school: '', phone_number: '', address: '', sex: 'M', category: 'Adult', retreat_code: retreatCode || '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.postParticipant(formData);
      toast.success("Registration successful! We can't wait to see you.");
      setSubmitted(true);
    } catch (err) {
      toast.error("Failed to register. Please check your information and try again.");
    }
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
          <button
            onClick={() => {
                setSubmitted(false);
                setFormData({ full_name: '', school: '', phone_number: '', address: '', sex: 'M', category: 'Adult' });
            }}
            className="text-[#6E2C3A] font-semibold underline"
          >
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

          <button className="w-full bg-[#1C2541] text-[#FAF6EE] py-3 rounded-lg font-bold hover:bg-[#2a3a63] transition mt-2">
            Complete Registration
          </button>
        </form>
      </div>
    </div>
  );
}