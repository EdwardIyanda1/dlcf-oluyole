import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService, { auth } from '../api';
import Logo from '../components/Logo';
import QRCodeCard from '../components/QRCodeCard';
import SEO from '../components/SEO';

const inputClass = "w-full border border-[#1C2541]/15 bg-[#FAF6EE] focus:bg-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#D4A857] transition text-sm";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [attendance, setAttendance] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.getUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Fetch personal details and attendance simultaneously
    Promise.all([
      apiService.getMyProfile().catch(() => null),
      apiService.getMyAttendance().catch(() => null)
    ]).then(([profRes, attRes]) => {
      if (profRes?.data) {
        setParticipant(profRes.data);
        setFormData({
          full_name: profRes.data.full_name,
          school: profRes.data.school,
          phone_number: profRes.data.phone_number,
          address: profRes.data.address,
        });
      }
      if (attRes?.data) {
        setAttendance(attRes.data);
      }
      setLoading(false);
    });
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiService.updateMyProfile(formData);
      setParticipant(res.data);
      
      // Keep the local storage auth user in sync if the name changed
      if (user.full_name !== res.data.full_name) {
        const updatedUser = { ...user, full_name: res.data.full_name };
        auth.setUser(updatedUser);
        setUser(updatedUser);
      }
      
      toast.success("Profile details updated!");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAF6EE] py-10 px-6">
      <SEO title="My Profile" description="View and edit your DLCF Retreat profile." />
      
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: QR Code & Auth Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#1C2541]/10 text-center">
            <div className="flex justify-center mb-6">
              <Logo size={48} withText={false} />
            </div>
            <h1 className="text-2xl font-bold text-[#1C2541] mb-1">{user.full_name}</h1>
            <p className="text-sm text-[#6B7785] mb-6">{user.email}</p>
            
            {/* {user.code ? (
              <div className="flex justify-center mb-6">
                <QRCodeCard value={user.code} caption="Check-In Code" size={160} />
              </div>
            ) : (
              <p className="text-sm text-[#6E2C3A] bg-[#6E2C3A]/10 p-3 rounded-lg mb-6">
                No check-in code assigned. Please complete your registration.
              </p>
            )} */}
            
            <div className="flex justify-center mb-6">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${user.is_admin ? 'bg-[#D4A857]/20 text-[#6E2C3A]' : 'bg-[#1C2541]/10 text-[#1C2541]'}`}>
                {user.is_admin ? 'Administrator' : 'Participant'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full border border-[#6E2C3A] text-[#6E2C3A] py-2.5 rounded-lg font-bold hover:bg-[#6E2C3A]/5 transition text-sm"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Right Column: Details & Attendance */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Personal Details Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#1C2541]/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1C2541]">My Details</h2>
              {participant && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-[#D4A857] hover:underline">
                  Edit Details
                </button>
              )}
            </div>

            {loading ? (
              <p className="text-[#6B7785] text-sm">Loading details...</p>
            ) : !participant ? (
              <p className="text-[#6B7785] text-sm">Your profile is incomplete. Please register for a retreat.</p>
            ) : isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">Full Name</label>
                    <input className={inputClass} value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">School / Institution</label>
                    <input className={inputClass} value={formData.school || ''} onChange={e => setFormData({...formData, school: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">Phone Number</label>
                    <input className={inputClass} value={formData.phone_number || ''} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">Home Address</label>
                    <textarea rows={2} className={inputClass} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button disabled={saving} onClick={handleSave} className="bg-[#1C2541] text-[#FAF6EE] px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#2a3a63] transition">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button disabled={saving} onClick={() => setIsEditing(false)} className="text-[#6B7785] text-sm font-semibold hover:underline px-2">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-[#6B7785] uppercase tracking-widest mb-1">Full Name</p>
                  <p className="font-medium text-[#1C2541]">{participant.full_name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6B7785] uppercase tracking-widest mb-1">School / Institution</p>
                  <p className="font-medium text-[#1C2541]">{participant.school || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6B7785] uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="font-medium text-[#1C2541]">{participant.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#6B7785] uppercase tracking-widest mb-1">Category & Sex</p>
                  <p className="font-medium text-[#1C2541]">{participant.category} • {participant.sex === 'M' ? 'Male' : 'Female'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-[#6B7785] uppercase tracking-widest mb-1">Home Address</p>
                  <p className="font-medium text-[#1C2541]">{participant.address || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Attendance History Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-[#1C2541]/10">
            <h2 className="text-xl font-bold text-[#1C2541] mb-6">Attendance History</h2>
            
            {loading ? (
              <p className="text-[#6B7785] text-sm">Loading attendance...</p>
            ) : !attendance ? (
              <p className="text-[#6B7785] text-sm">No attendance records found. Ensure you check in at the retreat!</p>
            ) : (
              <>
                <div className="flex items-center gap-3 sm:gap-6 mb-8">
                  <div className="bg-[#FAF6EE] p-4 rounded-xl text-center flex-1 border border-[#1C2541]/5">
                    <p className="text-3xl font-bold text-[#1C2541]">{attendance.sessions_attended}</p>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#6B7785] mt-1">Attended</p>
                  </div>
                  <div className="bg-[#FAF6EE] p-4 rounded-xl text-center flex-1 border border-[#1C2541]/5">
                    <p className="text-3xl font-bold text-[#1C2541]">{attendance.sessions_total}</p>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#6B7785] mt-1">Total</p>
                  </div>
                  <div className="bg-[#1C2541] p-4 rounded-xl text-center flex-1 shadow-md">
                    <p className="text-3xl font-bold text-[#D4A857]">{attendance.attendance_rate}%</p>
                    <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[#FAF6EE]/70 mt-1">Rate</p>
                  </div>
                </div>

                {attendance.by_day?.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-[#6B7785] uppercase tracking-widest mb-3">Daily Breakdown</p>
                    {attendance.by_day.map(day => (
                      <div key={day.date} className="flex justify-between items-center p-4 border border-[#1C2541]/10 rounded-xl hover:bg-[#FAF6EE] transition">
                        <div>
                          <p className="font-bold text-[#1C2541]">Day {day.day_number}</p>
                          <p className="text-xs text-[#6B7785] mt-0.5">{day.date} {day.label && `• ${day.label}`}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#1C2541]">{day.present} <span className="text-sm font-normal text-[#6B7785]">/ {day.total}</span></span>
                          <p className="text-[10px] uppercase tracking-widest text-[#6B7785]">Sessions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#6B7785] text-sm">You haven't attended any scheduled sessions yet.</p>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}