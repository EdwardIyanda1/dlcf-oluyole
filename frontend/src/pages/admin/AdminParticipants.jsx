import { useState, useEffect } from 'react';
import apiService from '../../api';

export default function AdminParticipants() {
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getParticipants().then((res) => {
      setParticipants(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = participants.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.school || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#FAF6EE] min-h-full">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Registry</p>
          <h2 className="text-3xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Registered Participants
          </h2>
        </div>
        <div className="bg-white rounded-xl border border-[#1C2541]/10 px-4 py-2 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-[#6B7785]">Total</p>
          <p className="text-2xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            {participants.length}
          </p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or school…"
        className="w-full border border-[#1C2541]/15 bg-white p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#D4A857] transition"
      />

      <div className="bg-white rounded-2xl border border-[#1C2541]/10 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#1C2541]">
            <tr>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Name</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">School</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Category</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Sex</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Phone</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-[#6B7785]">Loading&hellip;</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-[#6B7785]">No participants found.</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#1C2541]/5 last:border-0 hover:bg-[#FAF6EE]">
                  <td className="p-4 font-medium text-[#1C2541]">{p.full_name}</td>
                  <td className="p-4 text-[#6B7785]">{p.school || '—'}</td>
                  <td className="p-4">
                    <span className="text-xs font-semibold uppercase tracking-wide bg-[#D4A857]/15 text-[#6E2C3A] px-2 py-1 rounded-full">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-4 text-[#6B7785]">{p.sex === 'M' ? 'Male' : 'Female'}</td>
                  <td className="p-4 text-[#6B7785] font-mono text-sm">{p.phone_number || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}