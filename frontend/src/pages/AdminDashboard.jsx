import { useState, useEffect } from 'react';
import apiService from '../api';
import * as XLSX from 'xlsx';
import Logo from '../components/Logo';

export default function AdminDashboard() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getParticipants().then(res => {
      setParticipants(res.data);
      setLoading(false);
    });
  }, []);

  const getStats = (category, sex) =>
    participants.filter(p => p.category === category && p.sex === sex).length;

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(participants);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "Retreat_Attendance.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>

      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">
              Admin Dashboard
            </p>
            <h2
              className="text-3xl font-bold text-[#1C2541]"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Retreat Attendance
            </h2>
          </div>
          <button
            onClick={handleExport}
            className="bg-[#1C2541] text-[#FAF6EE] px-6 py-3 rounded-lg font-semibold hover:bg-[#2a3a63] transition"
          >
            Export Report
          </button>
        </div>

        {/* Stats matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {['Adult', 'Campus', 'Youth', 'Children'].map(cat => (
            <div key={cat} className="bg-white p-5 rounded-2xl border border-[#1C2541]/10">
              <h4
                className="font-bold text-[#1C2541] mb-3"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                {cat}
              </h4>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[#6B7785]">Male</span>
                <span className="font-mono font-bold text-[#1C2541] bg-[#FAF6EE] px-2 py-0.5 rounded">
                  {getStats(cat, 'M')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7785]">Female</span>
                <span className="font-mono font-bold text-[#6E2C3A] bg-[#FAF6EE] px-2 py-0.5 rounded">
                  {getStats(cat, 'F')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Participant list */}
        <div className="bg-white rounded-2xl border border-[#1C2541]/10 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#1C2541]">
              <tr>
                <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Name</th>
                <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">School</th>
                <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Category</th>
                <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Sex</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#6B7785]">
                    Loading participants&hellip;
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#6B7785]">
                    No one has registered yet.
                  </td>
                </tr>
              ) : (
                participants.map(p => (
                  <tr key={p.id} className="border-b border-[#1C2541]/5 last:border-0 hover:bg-[#FAF6EE]">
                    <td className="p-4 font-medium text-[#1C2541]">{p.full_name}</td>
                    <td className="p-4 text-[#6B7785]">{p.school || '—'}</td>
                    <td className="p-4">
                      <span className="text-xs font-semibold uppercase tracking-wide bg-[#D4A857]/15 text-[#6E2C3A] px-2 py-1 rounded-full">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 text-[#6B7785]">{p.sex === 'M' ? 'Male' : 'Female'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}