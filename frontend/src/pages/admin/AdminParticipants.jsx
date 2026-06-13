import { useState, useEffect } from 'react';
import apiService from '../../api';

export default function AdminParticipants() {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    apiService.getParticipants().then(res => setParticipants(res.data));
  }, []);

  return (
    <div className="bg-[#FAF6EE] min-h-full">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      
      <div className="mb-10">
        <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Registry</p>
        <h2 className="text-3xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          Registered Participants
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-[#1C2541]/10 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#1C2541]">
            <tr>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Name</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">School</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Category</th>
            </tr>
          </thead>
          <tbody>
            {participants.map(p => (
              <tr key={p.id} className="border-b border-[#1C2541]/5 hover:bg-[#FAF6EE]">
                <td className="p-4 font-medium text-[#1C2541]">{p.full_name}</td>
                <td className="p-4 text-[#6B7785]">{p.school || '—'}</td>
                <td className="p-4">
                  <span className="text-xs font-semibold uppercase tracking-wide bg-[#D4A857]/15 text-[#6E2C3A] px-2 py-1 rounded-full">
                    {p.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}