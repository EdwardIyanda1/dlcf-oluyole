import { useState, useEffect } from 'react';
import apiService from '../../api';

export default function AdminOverview() {
  const [participants, setParticipants] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiService.getParticipants(),
      apiService.getPrograms(),
      apiService.getSessions(),
    ]).then(([pRes, prRes, sRes]) => {
      setParticipants(pRes.data);
      setPrograms(prRes.data);
      setSessions(sRes.data);
      setLoading(false);
    });
  }, []);

  const getStats = (category, sex) =>
    participants.filter((p) => p.category === category && p.sex === sex).length;

  return (
    <div className="bg-[#FAF6EE] min-h-full">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>

      <div className="mb-10">
        <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">
          Admin Dashboard
        </p>
        <h2 className="text-3xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          Overview
        </h2>
      </div>

      {loading ? (
        <p className="text-[#6B7785]">Loading&hellip;</p>
      ) : (
        <>
          {/* Quick numbers */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white p-5 rounded-2xl border border-[#1C2541]/10 shadow-sm">
              <p className="text-xs font-semibold text-[#6B7785] uppercase tracking-widest mb-1">Total Registered</p>
              <p className="text-3xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                {participants.length}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#1C2541]/10 shadow-sm">
              <p className="text-xs font-semibold text-[#6B7785] uppercase tracking-widest mb-1">Retreat Programs</p>
              <p className="text-3xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                {programs.length}
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#1C2541]/10 shadow-sm col-span-2 md:col-span-1">
              <p className="text-xs font-semibold text-[#6B7785] uppercase tracking-widest mb-1">Sessions / Messages</p>
              <p className="text-3xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                {sessions.length}
              </p>
            </div>
          </div>

          {/* Category x sex matrix */}
          <h3 className="font-bold text-[#1C2541] mb-4">Registration Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Adult', 'Campus', 'Youth', 'Children'].map((cat) => (
              <div key={cat} className="bg-white p-5 rounded-2xl border border-[#1C2541]/10 shadow-sm">
                <h4 className="font-bold text-[#1C2541] mb-3" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
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
        </>
      )}
    </div>
  );
}