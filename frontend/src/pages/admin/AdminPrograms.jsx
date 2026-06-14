import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../api';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const FONT = { fontFamily: "'Fraunces', Georgia, serif" };
const inputCls = 'w-full border border-[#1C2541]/15 bg-[#FAF6EE] focus:bg-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#D4A857] transition';

/* ── PDF generator ─────────────────────────────────────────────────────────── */
const loadImg = (src) =>
  new Promise((res) => {
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload  = () => { const c = document.createElement('canvas'); c.width=img.width; c.height=img.height; c.getContext('2d').drawImage(img,0,0); res(c.toDataURL('image/png')); };
    img.onerror = () => res(null);
    img.src = src;
  });

async function generateRetreatPDF(retreat, qrSvg) {
  const doc = new jsPDF();
  const NAVY=[28,37,65], GOLD=[212,168,87], CREAM=[250,246,238], MAROON=[110,44,58], SLATE=[107,119,133];

  // Background
  doc.setFillColor(...CREAM); doc.rect(0,0,210,297,'F');
  // Header
  doc.setFillColor(...NAVY); doc.rect(0,0,210,45,'F');
  doc.setFillColor(...GOLD); doc.rect(0,45,210,1.5,'F');
  // Eyebrow
  doc.setFont('times','bold'); doc.setFontSize(10); doc.setTextColor(...GOLD);
  doc.text('DEEPER LIFE CAMPUS FELLOWSHIP  ·  LCU', 35, 14);
  // Title
  doc.setFontSize(22); doc.setTextColor(...CREAM);
  doc.text(retreat.name, 35, 33);
  // Logo
  const logoData = await loadImg('/logo.png');
  if (logoData) doc.addImage(logoData,'PNG',18,12,14,14);

  // Details card
  doc.setFillColor(255,255,255); doc.roundedRect(20,55,170,32,3,3,'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.6); doc.roundedRect(20,55,170,32,3,3,'S');
  doc.setFont('times','bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text(retreat.theme||'Retreat Program', 28,67);
  doc.setFont('times','normal'); doc.setFontSize(10); doc.setTextColor(...SLATE);
  doc.text(`${retreat.start_date}  to  ${retreat.end_date}`, 28,76);
  doc.setFont('times','bold'); doc.setTextColor(...MAROON);
  doc.text(`CODE: ${retreat.code}`, 145,76);

  // QR heading
  doc.setFont('times','bold'); doc.setFontSize(14); doc.setTextColor(...NAVY);
  doc.text('Scan to Register', 105,101,{align:'center'});

  // QR box
  doc.setFillColor(255,255,255); doc.roundedRect(55,108,100,100,4,4,'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(1); doc.roundedRect(55,108,100,100,4,4,'S');

  const svgStr = new XMLSerializer().serializeToString(qrSvg);
  const blob   = new Blob([svgStr],{type:'image/svg+xml;charset=utf-8'});
  const url    = URL.createObjectURL(blob);
  const qrImg  = new Image();
  qrImg.onload = () => {
    const c = document.createElement('canvas'); c.width=qrImg.width; c.height=qrImg.height;
    c.getContext('2d').drawImage(qrImg,0,0);
    doc.addImage(c.toDataURL('image/png'),'PNG',60,113,90,90);
    // Footer
    doc.setFont('times','bold'); doc.setFontSize(12); doc.setTextColor(...MAROON);
    doc.text(`Registration Code: ${retreat.code}`,105,222,{align:'center'});
    doc.setFont('times','italic'); doc.setFontSize(10); doc.setTextColor(...SLATE);
    doc.text('Scan to register online or present this at the registration desk.',105,231,{align:'center'});
    doc.setFillColor(...NAVY); doc.rect(0,285,210,12,'F');
    doc.setFont('times','normal'); doc.setFontSize(9); doc.setTextColor(...GOLD);
    doc.text('Deeper Life Campus Fellowship, Lead City University',105,292,{align:'center'});
    doc.save(`${retreat.name}_Registration_Card.pdf`);
    URL.revokeObjectURL(url);
  };
  qrImg.src = url;
}

/* ── Session management sub-view ─────────────────────────────────────────────── */
function ManageSessions({ program, onBack }) {
  const [days,       setDays]       = useState([]);
  const [selDay,     setSelDay]     = useState(null);
  const [sessions,   setSessions]   = useState([]);
  const [showNewDay, setShowNewDay] = useState(false);
  const [showNewSes, setShowNewSes] = useState(false);
  const [newDay,     setNewDay]     = useState({ date:'', day_number:'', label:'' });
  const [newSes,     setNewSes]     = useState({ title:'', speaker:'', start_time:'', end_time:'' });

  const loadDays = () => apiService.getDays(program.id).then(r => {
    setDays(r.data);
    if (!selDay && r.data.length) setSelDay(r.data[0]);
  });
  const loadSessions = (day) => apiService.getSessions(program.id, day.id).then(r => setSessions(r.data));

  useEffect(() => { loadDays(); }, []);
  useEffect(() => { if (selDay) loadSessions(selDay); }, [selDay]);

  const addDay = async () => {
    if (!newDay.date || !newDay.day_number) { toast.warning('Date and day number required.'); return; }
    await apiService.createDay(program.id, newDay);
    setNewDay({ date:'', day_number:'', label:'' }); setShowNewDay(false);
    loadDays(); toast.success('Day added!');
  };

  const addSession = async () => {
    if (!newSes.title || !newSes.start_time) { toast.warning('Title and start time required.'); return; }
    await apiService.createSession(program.id, selDay.id, { ...newSes, retreat_day: selDay.id });
    setNewSes({ title:'', speaker:'', start_time:'', end_time:'' }); setShowNewSes(false);
    loadSessions(selDay); toast.success('Session added!');
  };

  return (
    <div>
      <button onClick={onBack} className="text-[#6E2C3A] font-semibold text-sm underline mb-6">← All Programs</button>
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Program</p>
          <h2 className="text-2xl font-bold text-[#1C2541]" style={FONT}>{program.name}</h2>
          <p className="text-xs text-[#6B7785] mt-0.5">{program.start_date} – {program.end_date} · {program.theme}</p>
        </div>
        <button onClick={()=>setShowNewDay(true)}
          className="bg-[#1C2541] text-[#FAF6EE] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2a3a63] transition">
          + Add Day
        </button>
      </div>

      {showNewDay && (
        <div className="bg-white p-5 rounded-2xl border border-[#1C2541]/10 shadow-sm mb-6">
          <h4 className="font-bold text-[#1C2541] mb-4">Add Retreat Day</h4>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">Day #</label>
              <input type="number" className={inputCls} placeholder="1" value={newDay.day_number}
                onChange={e=>setNewDay({...newDay,day_number:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">Date</label>
              <input type="date" className={inputCls} value={newDay.date}
                onChange={e=>setNewDay({...newDay,date:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">Label (optional)</label>
              <input className={inputCls} placeholder="e.g. Arrival Day" value={newDay.label}
                onChange={e=>setNewDay({...newDay,label:e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={addDay} className="bg-[#1C2541] text-[#FAF6EE] px-5 py-2 rounded-lg font-bold text-sm">Save</button>
            <button onClick={()=>setShowNewDay(false)} className="text-[#6B7785] text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {days.length === 0 ? (
        <p className="text-[#6B7785]">No days added yet.</p>
      ) : (
        <div className="grid md:grid-cols-4 gap-6">
          {/* Day tabs */}
          <div className="md:col-span-1 flex md:flex-col gap-2">
            {days.map(d => (
              <button key={d.id} onClick={()=>setSelDay(d)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-semibold transition border ${
                  selDay?.id===d.id
                    ? 'bg-[#1C2541] text-[#FAF6EE] border-[#1C2541]'
                    : 'bg-white text-[#1C2541] border-[#1C2541]/10 hover:bg-[#FAF6EE]'
                }`}>
                <p className="font-bold">Day {d.day_number}</p>
                <p className="text-xs opacity-70">{d.date}</p>
                {d.label && <p className="text-xs opacity-60 italic">{d.label}</p>}
              </button>
            ))}
          </div>

          {/* Sessions for selected day */}
          <div className="md:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1C2541]" style={FONT}>
                Day {selDay?.day_number} – {selDay?.label || selDay?.date}
              </h3>
              <button onClick={()=>setShowNewSes(true)}
                className="bg-[#D4A857] text-[#1C2541] px-4 py-1.5 rounded-full text-sm font-bold hover:bg-[#e6bd72] transition">
                + Add Session
              </button>
            </div>

            {showNewSes && (
              <div className="bg-white p-5 rounded-2xl border border-[#1C2541]/10 shadow-sm mb-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">Title / Message</label>
                    <input className={inputCls} placeholder="e.g. Evening Revival" value={newSes.title}
                      onChange={e=>setNewSes({...newSes,title:e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">Speaker</label>
                    <input className={inputCls} placeholder="e.g. Pastor Adewale" value={newSes.speaker}
                      onChange={e=>setNewSes({...newSes,speaker:e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">Start Time</label>
                    <input type="time" className={inputCls} value={newSes.start_time}
                      onChange={e=>setNewSes({...newSes,start_time:e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">End Time</label>
                    <input type="time" className={inputCls} value={newSes.end_time}
                      onChange={e=>setNewSes({...newSes,end_time:e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={addSession} className="bg-[#1C2541] text-[#FAF6EE] px-5 py-2 rounded-lg font-bold text-sm">Save</button>
                  <button onClick={()=>setShowNewSes(false)} className="text-[#6B7785] text-sm font-semibold">Cancel</button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {sessions.length===0
                ? <p className="text-[#6B7785] text-sm">No sessions on this day yet.</p>
                : sessions.map(s => (
                  <div key={s.id} className="bg-white p-4 rounded-xl border border-[#1C2541]/10 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-[#1C2541]">{s.title}</p>
                      <p className="text-xs text-[#6B7785]">{s.speaker && `${s.speaker} · `}{s.start_time}{s.end_time && ` – ${s.end_time}`}</p>
                    </div>
                    <span className="text-xs bg-[#D4A857]/15 text-[#6E2C3A] px-3 py-1 rounded-full font-bold">
                      {s.attendance_count} present
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */
export default function AdminPrograms() {
  const [programs,     setPrograms]     = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [newProgram,   setNewProgram]   = useState({ name:'', theme:'', start_date:'', end_date:'' });
  const qrRefs = useRef({});

  const load = async () => {
    try { const r = await apiService.getPrograms(); setPrograms(r.data); }
    catch { toast.error('Failed to load programs.'); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newProgram.name || !newProgram.start_date || !newProgram.end_date) {
      toast.warning('Name and dates are required.'); return;
    }
    try {
      await apiService.postProgram(newProgram);
      setNewProgram({ name:'', theme:'', start_date:'', end_date:'' });
      setShowAdd(false); await load(); toast.success('Program created!');
    } catch { toast.error('Failed to create program.'); }
  };

  const statusBadge = (s) => {
    const map = { upcoming:'bg-blue-100 text-blue-700', ongoing:'bg-emerald-100 text-emerald-700',
                  grace:'bg-[#D4A857]/20 text-[#6E2C3A]', closed:'bg-slate-100 text-slate-500' };
    const label = { upcoming:'Upcoming', ongoing:'Ongoing', grace:'Grace Period', closed:'Closed' };
    return <span className={`text-xs font-bold px-3 py-1 rounded-full ${map[s]||''}`}>{label[s]||s}</span>;
  };

  if (selected) return <ManageSessions program={selected} onBack={()=>setSelected(null)} />;

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Management</p>
          <h2 className="text-3xl font-bold text-[#1C2541]" style={FONT}>Retreat Programs</h2>
        </div>
        <button onClick={()=>setShowAdd(true)}
          className="bg-[#1C2541] text-[#FAF6EE] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#2a3a63] transition">
          + New Program
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#1C2541]/10 mb-8">
          <h3 className="font-bold text-[#1C2541] mb-5">New Retreat Program</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">Program Name</label>
              <input className={inputCls} placeholder="e.g. Easter Retreat 2026" value={newProgram.name}
                onChange={e=>setNewProgram({...newProgram,name:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">Theme</label>
              <input className={inputCls} placeholder="e.g. Renewed for Glory" value={newProgram.theme}
                onChange={e=>setNewProgram({...newProgram,theme:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">Start Date</label>
              <input type="date" className={inputCls} value={newProgram.start_date}
                onChange={e=>setNewProgram({...newProgram,start_date:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-[#6B7785] uppercase tracking-wider mb-1">End Date</label>
              <input type="date" className={inputCls} value={newProgram.end_date}
                onChange={e=>setNewProgram({...newProgram,end_date:e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} className="bg-[#1C2541] text-[#FAF6EE] px-6 py-2.5 rounded-lg font-bold text-sm">Create Program</button>
            <button onClick={()=>setShowAdd(false)} className="text-[#6B7785] font-semibold text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {programs.map(r => (
          <div key={r.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#1C2541]/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#1C2541] text-lg" style={FONT}>{r.name}</h3>
                  <span className="text-xs bg-[#D4A857]/20 text-[#6E2C3A] px-2 py-0.5 rounded font-mono">{r.code}</span>
                  {statusBadge(r.status)}
                </div>
                <p className="text-sm text-[#6B7785]">{r.theme} · {r.start_date} → {r.end_date}</p>
                <p className="text-xs text-[#6B7785] mt-1">{r.days?.length || 0} day(s) · {r.days?.reduce((a,d)=>a+(d.sessions?.length||0),0)||0} sessions</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="p-2 bg-white border border-[#1C2541]/10 rounded-lg cursor-pointer hover:bg-[#FAF6EE] transition"
                  onClick={()=>generateRetreatPDF(r, qrRefs.current[r.id])} title="Download PDF">
                  <QRCodeSVG ref={el=>(qrRefs.current[r.id]=el)}
                    value={`${window.location.origin}/register?retreat_code=${r.code}`} size={48} />
                </div>
                <button onClick={()=>setSelected(r)}
                  className="bg-[#1C2541] text-[#FAF6EE] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2a3a63] transition">
                  Manage
                </button>
              </div>
            </div>
          </div>
        ))}
        {programs.length===0 && <p className="text-[#6B7785]">No programs yet.</p>}
      </div>
    </div>
  );
}