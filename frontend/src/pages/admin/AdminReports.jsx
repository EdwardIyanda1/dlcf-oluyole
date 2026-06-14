import { useState, useEffect } from 'react';
import apiService from '../../api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const FONT = { fontFamily: "'Fraunces', Georgia, serif" };
const NAVY=[28,37,65], GOLD=[212,168,87], CREAM=[250,246,238], MAROON=[110,44,58], SLATE=[107,119,133];

async function exportDayPDF(program, day) {
  const doc = new jsPDF();
  doc.setFillColor(...CREAM); doc.rect(0,0,210,297,'F');
  doc.setFillColor(...NAVY); doc.rect(0,0,210,40,'F');
  doc.setFillColor(...GOLD); doc.rect(0,40,210,1.5,'F');

  const loadImg = (src) => new Promise(res=>{
    const img=new Image(); img.crossOrigin='anonymous';
    img.onload=()=>{const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);res(c.toDataURL('image/png'));};
    img.onerror=()=>res(null); img.src=src;
  });
  const logo = await loadImg('/logo.png');
  if (logo) doc.addImage(logo,'PNG',14,12,14,14);

  doc.setFont('times','bold'); doc.setFontSize(9); doc.setTextColor(...GOLD);
  doc.text('DLCF LCU – ATTENDANCE REPORT', 33, 15);
  doc.setFontSize(18); doc.setTextColor(...CREAM);
  doc.text(`${program.name}`, 33, 27);
  doc.setFontSize(11);
  doc.text(`Day ${day.day_number} – ${day.date}${day.label?' ('+day.label+')':''}`, 33, 35);

  // Summary
  const bycat = day.by_category||{};
  let y=52;
  doc.setFont('times','bold'); doc.setFontSize(12); doc.setTextColor(...NAVY);
  doc.text('Summary', 14, y); y+=7;
  doc.setFont('times','normal'); doc.setFontSize(10); doc.setTextColor(...SLATE);
  doc.text(`Total Present: ${day.total_present}  ·  Male: ${day.by_sex?.M||0}  ·  Female: ${day.by_sex?.F||0}`, 14, y); y+=6;
  doc.text(`New Registrations on this day: ${day.registrations_today||0}`, 14, y); y+=10;

  // By category
  doc.setFont('times','bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text('Attendance by Category', 14, y); y+=6;
  doc.autoTable({
    startY: y,
    head: [['Category','Male','Female','Total']],
    body: ['Adult','Campus','Youth','Children'].map(c=>[
      c, bycat[c]?.M||0, bycat[c]?.F||0, (bycat[c]?.M||0)+(bycat[c]?.F||0)
    ]),
    headStyles: { fillColor: NAVY, textColor: CREAM, fontStyle:'bold' },
    bodyStyles: { textColor: NAVY },
    alternateRowStyles: { fillColor: [244,241,235] },
    margin: { left:14, right:14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  // Per-session breakdown
  if (day.sessions?.length) {
    doc.setFont('times','bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
    doc.text('Session Breakdown', 14, y); y+=6;
    doc.autoTable({
      startY: y,
      head: [['Session','Speaker','Time','Present','Absent','Total']],
      body: day.sessions.map(s=>[s.title, s.speaker||'—', s.start_time||'', s.present, s.absent, s.total]),
      headStyles: { fillColor: NAVY, textColor: CREAM, fontStyle:'bold' },
      bodyStyles: { textColor: NAVY },
      alternateRowStyles: { fillColor: [244,241,235] },
      margin: { left:14, right:14 },
    });
  }

  // Footer
  doc.setFillColor(...NAVY); doc.rect(0,285,210,12,'F');
  doc.setFont('times','normal'); doc.setFontSize(9); doc.setTextColor(...GOLD);
  doc.text('Deeper Life Campus Fellowship, Lead City University', 105, 292, {align:'center'});
  doc.save(`${program.name}_Day${day.day_number}_Report.pdf`);
}

async function exportOverallPDF(report) {
  const { program, days, total_registrations, unique_attendees } = report;
  const doc = new jsPDF();
  doc.setFillColor(...CREAM); doc.rect(0,0,210,297,'F');
  doc.setFillColor(...NAVY); doc.rect(0,0,210,42,'F');
  doc.setFillColor(...GOLD); doc.rect(0,42,210,1.5,'F');

  const loadImg = (src) => new Promise(res=>{
    const img=new Image(); img.crossOrigin='anonymous';
    img.onload=()=>{const c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);res(c.toDataURL('image/png'));};
    img.onerror=()=>res(null); img.src=src;
  });
  const logo = await loadImg('/logo.png');
  if (logo) doc.addImage(logo,'PNG',14,13,14,14);

  doc.setFont('times','bold'); doc.setFontSize(9); doc.setTextColor(...GOLD);
  doc.text('DLCF LCU – OVERALL RETREAT REPORT', 33,16);
  doc.setFontSize(20); doc.setTextColor(...CREAM);
  doc.text(program.name, 33,29);
  doc.setFontSize(11);
  doc.text(`${program.start_date} – ${program.end_date} · ${program.theme}`, 33,38);

  let y=55;
  doc.setFont('times','bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text('Overall Summary', 14, y); y+=7;
  doc.setFont('times','normal'); doc.setFontSize(10); doc.setTextColor(...SLATE);
  doc.text(`Total Registrations: ${total_registrations}  ·  Unique Attendees: ${unique_attendees}`, 14, y); y+=10;

  // Per-day table
  doc.setFont('times','bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text('Day-by-Day Summary', 14, y); y+=5;
  doc.autoTable({
    startY: y,
    head: [['Day','Date','Label','Present','New Reg']],
    body: days.map(d=>[`Day ${d.day_number}`, d.date, d.label||'—', d.total_present, d.registrations_today]),
    headStyles: { fillColor: NAVY, textColor: CREAM, fontStyle:'bold' },
    bodyStyles: { textColor: NAVY },
    alternateRowStyles: { fillColor: [244,241,235] },
    margin: { left:14, right:14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  // Category total across all days
  const totals = {};
  ['Adult','Campus','Youth','Children'].forEach(cat=>{
    totals[cat] = { M:0, F:0 };
    days.forEach(d=>{ totals[cat].M+=(d.by_category?.[cat]?.M||0); totals[cat].F+=(d.by_category?.[cat]?.F||0); });
  });
  if (y > 240) { doc.addPage(); doc.setFillColor(...CREAM); doc.rect(0,0,210,297,'F'); y=20; }
  doc.setFont('times','bold'); doc.setFontSize(11); doc.setTextColor(...NAVY);
  doc.text('Attendance by Category (Total)', 14, y); y+=5;
  doc.autoTable({
    startY: y,
    head: [['Category','Male','Female','Total']],
    body: ['Adult','Campus','Youth','Children'].map(c=>[c, totals[c].M, totals[c].F, totals[c].M+totals[c].F]),
    headStyles: { fillColor: NAVY, textColor: CREAM, fontStyle:'bold' },
    bodyStyles: { textColor: NAVY },
    alternateRowStyles: { fillColor: [244,241,235] },
    margin: { left:14, right:14 },
  });

  doc.setFillColor(...NAVY); doc.rect(0,285,210,12,'F');
  doc.setFont('times','normal'); doc.setFontSize(9); doc.setTextColor(...GOLD);
  doc.text('Deeper Life Campus Fellowship, Lead City University', 105,292,{align:'center'});
  doc.save(`${program.name}_Overall_Report.pdf`);
}

function exportExcel(report) {
  const { program, days } = report;
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = [
    ['Program', program.name],
    ['Theme',   program.theme],
    ['Dates',   `${program.start_date} – ${program.end_date}`],
    [],
    ['Day','Date','Label','Total Present','New Registrations'],
    ...days.map(d=>[`Day ${d.day_number}`, d.date, d.label||'', d.total_present, d.registrations_today]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');

  // Per-day sheets
  days.forEach(d => {
    const rows = [
      [`Day ${d.day_number} – ${d.date}${d.label?' ('+d.label+')':''}`],
      ['Session','Speaker','Time','Present','Absent','Total'],
      ...(d.sessions||[]).map(s=>[s.title, s.speaker||'', s.start_time||'', s.present, s.absent, s.total]),
      [],
      ['Category','Male','Female','Total'],
      ...['Adult','Campus','Youth','Children'].map(c=>{
        const r = d.by_category?.[c]||{M:0,F:0};
        return [c, r.M, r.F, r.M+r.F];
      }),
    ];
    const name = `Day ${d.day_number}`.substring(0,31);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  });

  XLSX.writeFile(wb, `${program.name}_Report.xlsx`);
}

export default function AdminReports() {
  const [programs,  setPrograms]  = useState([]);
  const [programId, setProgramId] = useState(null);
  const [report,    setReport]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [repLoading,setRepLoading]= useState(false);

  useEffect(() => {
    apiService.getPrograms().then(r=>{ setPrograms(r.data); if(r.data.length) setProgramId(r.data[0].id); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!programId) return;
    setReport(null); setRepLoading(true);
    apiService.getProgramReport(programId).then(r=>{ setReport(r.data); setRepLoading(false); });
  }, [programId]);

  if (loading) return <p className="text-[#6B7785]">Loading…</p>;

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Admin Dashboard</p>
      <h2 className="text-3xl font-bold text-[#1C2541] mb-8" style={FONT}>Reports</h2>

      {/* Program selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {programs.map(p=>(
          <button key={p.id} onClick={()=>setProgramId(p.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
              programId===p.id?'bg-[#1C2541] text-[#FAF6EE] border-[#1C2541]':'bg-white text-[#1C2541] border-[#1C2541]/15 hover:bg-[#FAF6EE]'}`}>
            {p.name}
          </button>
        ))}
      </div>

      {repLoading && <p className="text-[#6B7785]">Loading report…</p>}

      {report && (
        <>
          {/* Overall summary */}
          <div className="bg-white rounded-2xl border border-[#1C2541]/10 shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#1C2541]" style={FONT}>{report.program.name}</h3>
                <p className="text-sm text-[#6B7785]">{report.program.theme} · {report.program.start_date} – {report.program.end_date}</p>
                <div className="flex gap-6 mt-3">
                  <div><p className="text-2xl font-bold text-[#1C2541]" style={FONT}>{report.total_registrations}</p><p className="text-xs text-[#6B7785] uppercase tracking-widest">Registered</p></div>
                  <div><p className="text-2xl font-bold text-[#1C2541]" style={FONT}>{report.unique_attendees}</p><p className="text-xs text-[#6B7785] uppercase tracking-widest">Unique Attendees</p></div>
                </div>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button onClick={()=>exportOverallPDF(report)}
                  className="bg-[#1C2541] text-[#FAF6EE] px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#2a3a63] transition">
                  Overall PDF
                </button>
                <button onClick={()=>exportExcel(report)}
                  className="border border-[#1C2541]/15 text-[#1C2541] px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#FAF6EE] transition">
                  Excel (.xlsx)
                </button>
              </div>
            </div>
          </div>

          {/* Per-day cards */}
          <h3 className="font-bold text-[#1C2541] mb-4" style={FONT}>Per-Day Reports</h3>
          <div className="grid gap-4">
            {report.days.map(day => (
              <div key={day.id} className="bg-white rounded-2xl border border-[#1C2541]/10 shadow-sm p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-[#1C2541] text-[#FAF6EE] text-xs font-bold px-3 py-1 rounded-full">Day {day.day_number}</span>
                      <p className="font-bold text-[#1C2541]" style={FONT}>{day.date}{day.label&&` – ${day.label}`}</p>
                    </div>
                    <div className="flex gap-6 mb-4">
                      <div><p className="text-xl font-bold text-[#1C2541]" style={FONT}>{day.total_present}</p><p className="text-[10px] text-[#6B7785] uppercase tracking-widest">Present</p></div>
                      <div><p className="text-xl font-bold text-[#6E2C3A]" style={FONT}>{day.by_sex?.M||0}</p><p className="text-[10px] text-[#6B7785] uppercase tracking-widest">Male</p></div>
                      <div><p className="text-xl font-bold text-[#6E2C3A]" style={FONT}>{day.by_sex?.F||0}</p><p className="text-[10px] text-[#6B7785] uppercase tracking-widest">Female</p></div>
                      <div><p className="text-xl font-bold text-[#1C2541]" style={FONT}>{day.registrations_today}</p><p className="text-[10px] text-[#6B7785] uppercase tracking-widest">New Reg</p></div>
                    </div>

                    {/* Sessions */}
                    {day.sessions?.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="text-[10px] text-[#6B7785] uppercase tracking-wider border-b border-[#1C2541]/10">
                              <th className="pb-2 pr-4">Session</th>
                              <th className="pb-2 pr-4">Speaker</th>
                              <th className="pb-2 pr-4">Present</th>
                              <th className="pb-2 pr-4">Absent</th>
                              <th className="pb-2">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {day.sessions.map(s=>(
                              <tr key={s.id} className="border-b border-[#1C2541]/5 last:border-0">
                                <td className="py-2 pr-4 font-medium text-[#1C2541]">{s.title}</td>
                                <td className="py-2 pr-4 text-[#6B7785]">{s.speaker||'—'}</td>
                                <td className="py-2 pr-4 font-mono font-bold text-[#1C2541]">{s.present}</td>
                                <td className="py-2 pr-4 font-mono font-bold text-[#6E2C3A]">{s.absent}</td>
                                <td className="py-2 font-mono text-[#6B7785]">{s.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <button onClick={()=>exportDayPDF(report.program, day)}
                    className="flex-shrink-0 border border-[#1C2541]/15 text-[#1C2541] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#FAF6EE] transition">
                    Day PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}