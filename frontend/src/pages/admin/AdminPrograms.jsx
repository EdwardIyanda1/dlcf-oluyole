import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../api';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminPrograms() {
  const [retreats, setRetreats] = useState([]);
  const [selectedRetreat, setSelectedRetreat] = useState(null);
  const [showAddRetreat, setShowAddRetreat] = useState(false);
  const [newRetreat, setNewRetreat] = useState({ name: '', theme: '', code: '', start_date: '', end_date: '' });
  
  const qrRefs = useRef({});

  const fetchRetreats = async () => {
    try {
      const res = await apiService.getPrograms();
      setRetreats(res.data);
    } catch (err) {
      toast.error("Failed to load programs.");
      console.error("Failed to fetch programs", err);
    }
  };

  useEffect(() => {
    fetchRetreats();
  }, []);

  const downloadQRCode = (retreatId) => {
    const svg = qrRefs.current[retreatId];
    if (!svg) {
      toast.error("QR Code not ready.");
      return;
    }

    const serializer = new XMLSerializer();
    const svgBlob = new Blob([serializer.serializeToString(svg)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `Retreat_QR_${retreatId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.info("QR Code downloaded!");
  };

  const handleAddRetreat = async () => {
    if (!newRetreat.name || !newRetreat.code) {
      toast.warning("Please fill in the Name and Code fields.");
      return;
    }
    try {
      await apiService.postProgram({
        name: newRetreat.name,
        theme: newRetreat.theme,
        code: newRetreat.code,
        start_date: newRetreat.start_date,
        end_date: newRetreat.end_date
      });
      await fetchRetreats();
      setNewRetreat({ name: '', theme: '', code: '', start_date: '', end_date: '' });
      setShowAddRetreat(false);
      toast.success("Retreat created successfully!");
    } catch (err) {
      toast.error("Failed to save retreat.");
      console.error("Failed to save program", err);
    }
  };

  if (selectedRetreat) {
    return (
      <div className="bg-[#FAF6EE] min-h-full p-4 md:p-8">
        <button onClick={() => setSelectedRetreat(null)} className="text-[#6E2C3A] font-semibold underline mb-6">← Back to All Retreats</button>
        <h2 className="text-2xl md:text-3xl font-bold text-[#1C2541] mb-2">{selectedRetreat.name}</h2>
        <p className="text-[#6B7785] mb-8 uppercase tracking-widest text-xs font-bold">{selectedRetreat.code} | {selectedRetreat.theme} | {selectedRetreat.start_date} to {selectedRetreat.end_date}</p>
        
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#1C2541]/10">
            <h3 className="font-bold text-[#1C2541] mb-4">Daily Sessions</h3>
            <p className="text-[#6B7785]">Add, edit, and view attendance for sessions belonging to {selectedRetreat.name}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF6EE] min-h-full p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Management</p>
          <h2 className="text-3xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Retreat Programs</h2>
        </div>
        <button onClick={() => setShowAddRetreat(true)} className="w-full md:w-auto bg-[#6E2C3A] text-[#FAF6EE] px-6 py-3 rounded-lg font-semibold hover:bg-[#8a3a4b] transition">
          + Add New Retreat
        </button>
      </div>

      {showAddRetreat && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-[#1C2541]/10 mb-8">
          <h3 className="font-bold text-[#1C2541] mb-6">Define New Retreat</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border p-3 rounded-lg" placeholder="Retreat Name" value={newRetreat.name} onChange={e => setNewRetreat({...newRetreat, name: e.target.value})} />
            <input className="border p-3 rounded-lg" placeholder="Retreat Code (e.g. DLCF-DEC25)" value={newRetreat.code} onChange={e => setNewRetreat({...newRetreat, code: e.target.value})} />
            <input className="border p-3 rounded-lg col-span-1 md:col-span-2" placeholder="Theme" value={newRetreat.theme} onChange={e => setNewRetreat({...newRetreat, theme: e.target.value})} />
            <input className="border p-3 rounded-lg" type="date" value={newRetreat.start_date} onChange={e => setNewRetreat({...newRetreat, start_date: e.target.value})} />
            <input className="border p-3 rounded-lg" type="date" value={newRetreat.end_date} onChange={e => setNewRetreat({...newRetreat, end_date: e.target.value})} />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleAddRetreat} className="bg-[#1C2541] text-[#FAF6EE] px-6 py-3 rounded-lg font-bold">Save Retreat</button>
            <button onClick={() => setShowAddRetreat(false)} className="text-[#6B7785] font-semibold">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {retreats.map(r => (
          <div key={r.id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#1C2541]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-[#1C2541] text-lg">{r.name} <span className="text-xs bg-[#D4A857]/20 px-2 py-1 rounded ml-2">{r.code}</span></h3>
              <p className="text-sm text-[#6B7785]">{r.theme} &bull; {r.start_date} to {r.end_date}</p>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div 
                className="p-2 bg-white border border-[#1C2541]/10 rounded-lg cursor-pointer hover:bg-[#FAF6EE] transition flex-shrink-0"
                onClick={() => downloadQRCode(r.id)}
                title="Click to download QR"
              >
                <QRCodeSVG 
                  ref={(el) => (qrRefs.current[r.id] = el)}
                  value={`${window.location.origin}/register?code=${r.code}`} 
                  size={48} 
                />
              </div>
              <button onClick={() => setSelectedRetreat(r)} className="flex-1 md:flex-none bg-[#1C2541] text-[#FAF6EE] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2a3a63]">
                Manage Sessions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}