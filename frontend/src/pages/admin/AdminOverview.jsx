import { useState, useEffect } from 'react';
import apiService, { isCanceled } from '../../api';
import ExportButtons from '../../components/ExportButtons';

const FONT = { fontFamily: "'Fraunces', Georgia, serif" };
const CATEGORIES = ['Adult', 'Campus', 'Youth', 'Children'];

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#1C2541]/10 shadow-sm">
      <p className="text-[10px] font-bold text-[#6B7785] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold text-[#1C2541]" style={FONT}>{value}</p>
      {sub && <p className="text-xs text-[#6B7785] mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminOverview() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiService.getParticipantStats({ signal: controller.signal }),
      apiService.getPrograms({ signal: controller.signal }),
    ]).then(([statsRes, prRes]) => {
      setData({
        participantTotal: statsRes.data.total,
        byCategory: statsRes.data.by_category,
        programs: prRes.data.results ?? prRes.data,
      });
      setLoading(false);
    }).catch((err) => {
      if (isCanceled(err)) return;
      console.error(err);
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  if (loading || !data) return <p className="text-[#6B7785]">Loading…</p>;

  const { participantTotal, byCategory, programs } = data;
  const ongoing  = programs.filter(p => p.status === 'ongoing' || p.status === 'grace');
  const upcoming = programs.filter(p => p.status === 'upcoming');

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Admin Dashboard</p>
      <h2 className="text-3xl font-bold text-[#1C2541] mb-8" style={FONT}>Overview</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Registered" value={participantTotal} />
        <StatCard label="Programs" value={programs.length} />
        <StatCard label="Active Now" value={ongoing.length} sub={ongoing.map(p=>p.name).join(', ') || '—'} />
        <StatCard label="Upcoming" value={upcoming.length} sub={upcoming.map(p=>p.name).join(', ') || '—'} />
      </div>

      {ongoing.length > 0 && (
        <div className="mb-10">
          <h3 className="font-bold text-[#1C2541] mb-4" style={FONT}>Active Retreats</h3>
          <div className="grid gap-3">
            {ongoing.map(prog => (
              <div key={prog.id} className="bg-white rounded-2xl border border-[#1C2541]/10 p-5 flex flex-col md:flex-row md:justify-between md:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-bold text-[#1C2541]">{prog.name}</p>
                    <p className="text-sm text-[#6B7785]">{prog.start_date} → {prog.end_date}</p>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    prog.status === 'grace'
                      ? 'bg-[#D4A857]/20 text-[#6E2C3A]'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {prog.status === 'grace' ? 'Grace period' : 'Ongoing'}
                  </span>
                </div>
                <ExportButtons
                  onExcel={() => apiService.exportProgramReportExcel(prog.id)}
                  onPdf={() => apiService.exportProgramReportPdf(prog.id)}
                  excelName={`${prog.code}_report.xlsx`}
                  pdfName={`${prog.code}_report.pdf`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-bold text-[#1C2541] mb-4" style={FONT}>Registration Breakdown</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map(cat => (
          <div key={cat} className="bg-white p-5 rounded-2xl border border-[#1C2541]/10 shadow-sm">
            <h4 className="font-bold text-[#1C2541] mb-3" style={FONT}>{cat}</h4>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[#6B7785]">Male</span>
              <span className="font-mono font-bold text-[#1C2541] bg-[#FAF6EE] px-2 py-0.5 rounded">{byCategory[cat]?.M ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B7785]">Female</span>
              <span className="font-mono font-bold text-[#6E2C3A] bg-[#FAF6EE] px-2 py-0.5 rounded">{byCategory[cat]?.F ?? 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}