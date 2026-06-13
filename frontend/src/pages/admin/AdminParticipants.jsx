// src/pages/admin/AdminParticipants.jsx
import { useState, useEffect } from 'react';
import apiService from '../../api';

export default function AdminParticipants() {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    apiService.getParticipants().then(res => setParticipants(res.data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-[#1C2541]">Registered Participants</h1>
      <div className="bg-white rounded-xl shadow-sm border border-[#1C2541]/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#1C2541] text-[#FAF6EE]/70 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">School</th>
              <th className="p-4">Category</th>
            </tr>
          </thead>
          <tbody>
            {participants.map(p => (
              <tr key={p.id} className="border-b border-[#1C2541]/5 hover:bg-[#FAF6EE]">
                <td className="p-4 font-medium">{p.full_name}</td>
                <td className="p-4 text-[#6B7785]">{p.school}</td>
                <td className="p-4">{p.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}