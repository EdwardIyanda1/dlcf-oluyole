import { useState, useEffect } from 'react';
import apiService from '../../api';

export default function AdminAttendance() {
  const [programs, setPrograms] = useState([]);
  const [programId, setProgramId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Load programs
  useEffect(() => {
    apiService.getPrograms().then((res) => {
      setPrograms(res.data);
      if (res.data.length) setProgramId(res.data[0].id);
      setLoading(false);
    });
  }, []);

  // Load sessions for selected program
  useEffect(() => {
    if (programId == null) return;
    apiService.getSessions(programId).then((res) => {
      setSessions(res.data);
      setSessionId(res.data.length ? res.data[0].id : null);
    });
  }, [programId]);

  // Load attendance for selected session
  useEffect(() => {
    if (sessionId == null) {
      setRecords([]);
      return;
    }
    apiService.getAttendance(sessionId).then((res) => setRecords(res.data));
  }, [sessionId]);

  const toggle = async (participantId, current) => {
    const next = !current;
    setRecords((prev) => prev.map((r) => (r.id === participantId ? { ...r, present: next } : r)));
    await apiService.markAttendance(sessionId, participantId, next);
  };

  const filtered = records.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  );
  const presentCount = records.filter((r) => r.present).length;
  const activeSession = sessions.find((s) => s.id === sessionId);

  return (
    <div className="bg-[#FAF6EE] min-h-full">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>

      <div className="mb-8">
        <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">
          Admin Dashboard
        </p>
        <h2 className="text-3xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          Attendance
        </h2>
        <p className="text-[#6B7785] text-sm mt-1">
          Take and review attendance per message / session.
        </p>
      </div>

      {loading ? (
        <p className="text-[#6B7785]">Loading&hellip;</p>
      ) : programs.length === 0 ? (
        <p className="text-[#6B7785]">No retreat programs yet. Add one under Programs.</p>
      ) : (
        <>
          {/* Program selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-2">
              Retreat Program
            </label>
            <div className="flex flex-wrap gap-2">
              {programs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProgramId(p.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${
                    programId === p.id
                      ? 'bg-[#1C2541] text-[#FAF6EE] border-[#1C2541]'
                      : 'border-[#1C2541]/15 text-[#1C2541] bg-white hover:bg-[#FAF6EE]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Session selector */}
          {sessions.length === 0 ? (
            <p className="text-[#6B7785] mb-6">No sessions added for this program yet.</p>
          ) : (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-2">
                Session / Message
              </label>
              <div className="flex flex-wrap gap-2">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSessionId(s.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition border ${
                      sessionId === s.id
                        ? 'bg-[#D4A857] text-[#1C2541] border-[#D4A857]'
                        : 'border-[#1C2541]/15 text-[#1C2541] bg-white hover:bg-[#FAF6EE]'
                    }`}
                  >
                    {s.title} <span className="opacity-60 ml-1">{s.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sessionId != null && (
            <>
              {/* Summary bar */}
              <div className="bg-white rounded-2xl border border-[#1C2541]/10 shadow-sm p-5 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                    {activeSession?.title}
                  </h3>
                  <p className="text-sm text-[#6B7785]">
                    {activeSession?.speaker} &bull; {activeSession?.date} at {activeSession?.time}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center bg-[#FAF6EE] rounded-xl px-4 py-2">
                    <p className="text-2xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                      {presentCount}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-[#6B7785]">Present</p>
                  </div>
                  <div className="text-center bg-[#FAF6EE] rounded-xl px-4 py-2">
                    <p className="text-2xl font-bold text-[#6E2C3A]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                      {records.length - presentCount}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-[#6B7785]">Absent</p>
                  </div>
                  <div className="text-center bg-[#FAF6EE] rounded-xl px-4 py-2">
                    <p className="text-2xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                      {records.length}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-[#6B7785]">Total</p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-full border border-[#1C2541]/15 bg-white p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#D4A857] transition"
              />

              {/* Attendance list */}
              <div className="bg-white rounded-2xl border border-[#1C2541]/10 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#1C2541]">
                    <tr>
                      <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Name</th>
                      <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Category</th>
                      <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Sex</th>
                      <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70 text-right">Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[#6B7785]">No participants found.</td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p.id} className="border-b border-[#1C2541]/5 last:border-0 hover:bg-[#FAF6EE]">
                          <td className="p-4 font-medium text-[#1C2541]">{p.full_name}</td>
                          <td className="p-4">
                            <span className="text-xs font-semibold uppercase tracking-wide bg-[#D4A857]/15 text-[#6E2C3A] px-2 py-1 rounded-full">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-4 text-[#6B7785]">{p.sex === 'M' ? 'Male' : 'Female'}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => toggle(p.id, p.present)}
                              className={`w-11 h-6 rounded-full relative transition ${
                                p.present ? 'bg-[#D4A857]' : 'bg-[#1C2541]/10'
                              }`}
                              aria-label={p.present ? 'Mark absent' : 'Mark present'}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                                  p.present ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}