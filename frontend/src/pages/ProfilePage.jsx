import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import Logo from '../components/Logo';
import QRCodeCard from '../components/QRCodeCard';
import SEO from '../components/SEO';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.getUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    auth.logout(); // Clears storage and redirects to /login
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAF6EE] py-12 px-6">
      <SEO title="My Profile" description="View your DLCF Retreat profile and check-in code." />
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={56} withText={false} />
          </div>
          <p className="text-[#6E2C3A] text-sm font-semibold tracking-[0.25em] uppercase mb-2">
            Participant Profile
          </p>
          <h1 className="text-3xl font-bold text-[#1C2541]">
            {user.full_name}
          </h1>
          <p className="text-sm text-[#6B7785] mt-2">
            {user.email}
          </p>
        </div>

        {user.code ? (
          <div className="flex justify-center mb-8">
            <QRCodeCard 
              value={user.code} 
              label={user.code} 
              caption="Your personal check-in code" 
              size={180} 
            />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#1C2541]/10 text-center mb-8">
            <p className="text-[#6B7785]">No check-in code assigned yet. Please complete your registration.</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#1C2541]/10 space-y-4">
          <div className="flex justify-between items-center border-b border-[#1C2541]/10 pb-3">
            <span className="text-xs font-bold text-[#6B7785] uppercase tracking-widest">Name</span>
            <span className="font-medium text-[#1C2541]">{user.full_name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-[#1C2541]/10 pb-3">
            <span className="text-xs font-bold text-[#6B7785] uppercase tracking-widest">Email</span>
            <span className="font-medium text-[#1C2541]">{user.email}</span>
          </div>
          <div className="flex justify-between items-center border-b border-[#1C2541]/10 pb-3">
            <span className="text-xs font-bold text-[#6B7785] uppercase tracking-widest">Role</span>
            <span className="font-medium text-[#1C2541]">
              {user.is_admin ? (
                <span className="bg-[#D4A857]/20 text-[#6E2C3A] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Admin</span>
              ) : (
                'Participant'
              )}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full mt-4 border border-[#6E2C3A] text-[#6E2C3A] py-3 rounded-lg font-bold hover:bg-[#6E2C3A]/5 transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}