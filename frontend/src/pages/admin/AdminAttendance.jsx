import { useState, useEffect } from 'react';
import apiService, { isCanceled } from '../../api';
import ExportButtons from '../../components/ExportButtons';

const FONT = { fontFamily: "'Fraunces', Georgia, serif" };

export default function AdminAttendance() {
  const [programs,   setPrograms]   = useState([]);
  const [programId,  setProgramId]  = useState(null);
  const [days,       setDays]       = useState([]);
  const [dayId,      setDayId]      = useState(null);
  const [sessions,   setSessions]   = useState([]);
  const [sessionId,  setSessionId]  = useState(null);
  const [records,    setRecords]    = useState([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiService.getPrograms({ signal: controller.signal }).then(r => {
      const active = r.data.filter(p => p.status === 'ongoing' || p.status === 'grace');
      const list   = active.length ? active : r.data;
      setPrograms(list);
      if (list.length) setProgramId(list[0].id);
      setLoading(false);
    }).catch(err => {
      if (isCanceled(err)) return;
      console.error(err);
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!programId) return;
    setDayId(null); setSessions([]); setSessionId(null); setRecords([]);
    const controller = new AbortController();
    apiService.getDays(programId, { signal: controller.signal }).then(r => {
      setDays(r.data);
      const today = new Date().toISOString().slice(0,10);
      const todayDay = r.data.find(d => d.date === today);
      setDayId((todayDay || r.data[0])?.id || null);
    }).catch(err => { if (!isCanceled(err)) console.error(err); });
    return () => controller.abort();
  }, [programId]);

  useEffect(() => {
    if (!programId || !dayId) return;
    setSessionId(null); setRecords([]);
    const controller = new AbortController();
    apiService.getSessions(programId, dayId, { signal: controller.signal }).then(r => {
      setSessions(r.data);
      if (r.data.length) setSessionId(r.data[0].id);
    }).catch(err => { if (!isCanceled(err)) console.error(err); });
    return () => controller.abort();
  }, [dayId]);

  useEffect(() => {
    if (!programId || !dayId || !sessionId) { setRecords([]); return; }
    const controller = new AbortController();
    apiService.getAttendance(programId, dayId, sessionId, { signal: controller.signal })
      .then(r => setRecords(r.data))
      .catch(err => { if (!isCanceled(err)) console.error(err); });
    return () => controller.abort();
  }, [sessionId]);

  const toggle = async (participantId, current) => {
    const next = !current;
    setRecords(prev => prev.map(r => r.participant_id===participantId ? {...r, present:next} : r));
    setSaving(true);
    try {
      await apiService.markAttendance(programId, dayId, sessionId, participantId, next);
    } catch {
      setRecords(prev => prev.map(r => r.participant_id===participantId ? {...r, present:current} : r));
    }
    setSaving(false);
  };

  const markAll = async (present) => {
    setRecords(prev => prev.map(r => ({...r, present})));
    await Promise.all(
      records.map(r => apiService.markAttendance(programId, dayId, sessionId, r.participant_id, present))
    );
  };

  const filtered      = records.filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()));
  const presentCount  = records.filter(r => r.present).length;
  const activeProgram = programs.find(p => p.id === programId);
  const activeDay     = days.find(d => d.id === dayId);
  const activeSession = sessions.find(s => s.id === sessionId);

  if (loading) return <p className="text-[#6B7785]">Loading…</p>;

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Admin Dashboard</p>
      <h2 className="text-3xl font-bold text-[#1C2541] mb-1" style={FONT}>Attendance</h2>
      <p className="text-[#6B7785] text-sm mb-8">Select a program → day → session to take attendance.</p>

      {programs.length === 0
        ? <p className="text-[#6B7785]">No programs yet. Add one under Programs.</p>
        : (
        <>
          <div className="mb-5">
            <label className="block text-xs font-bold text-[#6B7785] uppercase tracking-widest mb-2">Program</label>
            <div className="flex flex-wrap gap-2">
              {programs.map(p => (
                <button key={p.id} onClick={() => setProgramId(p.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                    programId===p.id ? 'bg-[#1C2541] text-[#FAF6EE] border-[#1C2541]'
                                     : 'bg-white text-[#1C2541] border-[#1C2541]/15 hover:bg-[#FAF6EE]'}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {days.length === 0
            ? <p className="text-[#6B7785] mb-4 text-sm">No days set up for this program.</p>
            : (
            <div className="mb-5">
              <label className="block text-xs font-bold text-[#6B7785] uppercase tracking-widest mb-2">Day</label>
              <div className="flex flex-wrap gap-2">
                {days.map(d => (
                  <button key={d.id} onClick={() => setDayId(d.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                      dayId===d.id ? 'bg-[#1C2541] text-[#FAF6EE] border-[#1C2541]'
                                   : 'bg-white text-[#1C2541] border-[#1C2541]/15 hover:bg-[#FAF6EE]'}`}>
                    Day {d.day_number} <span className="opacity-60 ml-1">{d.date}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {dayId && (sessions.length === 0
            ? <p className="text-[#6B7785] mb-4 text-sm">No sessions on this day yet.</p>
            : (
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#6B7785] uppercase tracking-widest mb-2">Session / Message</label>
              <div className="flex flex-wrap gap-2">
                {sessions.map(s => (
                  <button key={s.id} onClick={() => setSessionId(s.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                      sessionId===s.id ? 'bg-[#D4A857] text-[#1C2541] border-[#D4A857]'
                                       : 'bg-white text-[#1C2541] border-[#1C2541]/15 hover:bg-[#FAF6EE]'}`}>
                    {s.title} <span className="opacity-60 ml-1">{s.start_time}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {sessionId && (
            <>
              <div className="bg-white rounded-2xl border border-[#1C2541]/10 shadow-sm p-5 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#1C2541]" style={FONT}>{activeSession?.title}</h3>
                  <p className="text-sm text-[#6B7785]">
                    {activeProgram?.name} · Day {activeDay?.day_number} ({activeDay?.date})
                    {activeSession?.speaker && ` · ${activeSession.speaker}`}
                  </p>
                  {saving && <p className="text-xs text-[#D4A857] mt-1">Saving…</p>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {[{label:'Present',val:presentCount,color:'text-[#1C2541]'},
                      {label:'Absent', val:records.length-presentCount,color:'text-[#6E2C3A]'},
                      {label:'Total',  val:records.length,color:'text-[#1C2541]'}].map(s=>(
                      <div key={s.label} className="text-center bg-[#FAF6EE] rounded-xl px-4 py-2">
                        <p className={`text-2xl font-bold ${s.color}`} style={FONT}>{s.val}</p>
                        <p className="text-[10px] uppercase tracking-widest text-[#6B7785]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <ExportButtons
                    onExcel={() => apiService.exportAttendanceExcel(programId, dayId, sessionId, { search: search || undefined })}
                    onPdf={() => apiService.exportAttendancePdf(programId, dayId, sessionId, { search: search || undefined })}
                    excelName={`attendance_${activeSession?.title || 'session'}.xlsx`}
                    pdfName={`attendance_${activeSession?.title || 'session'}.pdf`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="flex-1 min-w-48 border border-[#1C2541]/15 bg-white p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#D4A857] transition text-sm" />
                <button onClick={()=>markAll(true)}
                  className="px-4 py-2 bg-[#1C2541] text-[#FAF6EE] rounded-lg text-sm font-semibold hover:bg-[#2a3a63] transition">
                  Mark All Present
                </button>
                <button onClick={()=>markAll(false)}
                  className="px-4 py-2 border border-[#1C2541]/15 text-[#1C2541] rounded-lg text-sm font-semibold hover:bg-[#FAF6EE] transition">
                  Clear All
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-[#1C2541]/10 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#1C2541]">
                    <tr>
                      {['Name','Category','Sex','Present'].map(h=>(
                        <th key={h} className={`p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70 ${h==='Present'?'text-right':''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0
                      ? <tr><td colSpan={4} className="p-8 text-center text-[#6B7785]">No participants found.</td></tr>
                      : filtered.map(p => (
                        <tr key={p.participant_id} className="border-b border-[#1C2541]/5 last:border-0 hover:bg-[#FAF6EE]">
                          <td className="p-4 font-medium text-[#1C2541]">{p.full_name}</td>
                          <td className="p-4">
                            <span className="text-xs font-semibold uppercase tracking-wide bg-[#D4A857]/15 text-[#6E2C3A] px-2 py-1 rounded-full">{p.category}</span>
                          </td>
                          <td className="p-4 text-[#6B7785]">{p.sex==='M'?'Male':'Female'}</td>
                          <td className="p-4 text-right">
                            <button onClick={()=>toggle(p.participant_id, p.present)}
                              className={`w-11 h-6 rounded-full relative transition ${p.present?'bg-[#D4A857]':'bg-[#1C2541]/10'}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${p.present?'translate-x-5':'translate-x-0'}`} />
                            </button>
                          </td>
                        </tr>
                      ))
                    }
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