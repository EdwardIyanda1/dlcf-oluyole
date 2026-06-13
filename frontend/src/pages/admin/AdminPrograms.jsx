import { useState } from 'react';

export default function AdminPrograms() {
  const [selectedProgram, setSelectedProgram] = useState(null);
  
  // Mock data - In production, fetch this based on the program ID
  const [programs] = useState([
    { id: 1, title: 'Morning Devotion', date: '2026-06-13', attendance: { Adult: {M: 50, F: 60}, Campus: {M: 80, F: 90} } },
    { id: 2, title: 'Bible Study', date: '2026-06-13', attendance: { Adult: {M: 40, F: 50}, Campus: {M: 70, F: 80} } }
  ]);

  if (selectedProgram) {
    return (
      <div>
        <button onClick={() => setSelectedProgram(null)} className="text-sm text-gray-500 underline mb-4">← Back to Programs</button>
        <h1 className="text-2xl font-bold mb-6 text-[#1C2541]">{selectedProgram.title} - Attendance Breakdown</h1>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(selectedProgram.attendance).map(([cat, stats]) => (
            <div key={cat} className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold text-[#1C2541] border-b pb-2 mb-4">{cat}</h3>
              <p>Male: <span className="font-mono font-bold">{stats.M}</span></p>
              <p>Female: <span className="font-mono font-bold">{stats.F}</span></p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-[#1C2541]">Programs & Attendance</h1>
      <div className="grid gap-4">
        {programs.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#1C2541]/10 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-[#1C2541]">{p.title}</h3>
              <p className="text-sm text-[#6B7785]">{p.date}</p>
            </div>
            <button 
              onClick={() => setSelectedProgram(p)}
              className="bg-[#1C2541] text-[#FAF6EE] px-4 py-2 rounded-lg text-sm font-bold"
            >
              View Detailed Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}