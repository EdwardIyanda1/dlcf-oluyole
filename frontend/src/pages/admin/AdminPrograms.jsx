import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../api';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminPrograms() {
  const [retreats, setRetreats] = useState([]);
  const [selectedRetreat, setSelectedRetreat] = useState(null);
  const [showAddRetreat, setShowAddRetreat] = useState(false);
  const [newRetreat, setNewRetreat] = useState({ name: '', theme: '', code: '', start_date: '', end_date: '' });
  
  const qrRefs = useRef({});

  const generateRetreatPDF = async (retreat) => {
    const doc = new jsPDF();
    const svg = qrRefs.current[retreat.id];

    if (!retreat.code) {
      toast.error("Retreat code is missing!");
      return;
    }

    if (!svg) {
      toast.error("QR Code not ready, please wait.");
      return;
    }

    const NAVY = [28, 37, 65];     // #1C2541
    const GOLD = [212, 168, 87];   // #D4A857
    const CREAM = [250, 246, 238]; // #FAF6EE
    const MAROON = [110, 44, 58];  // #6E2C3A
    const SLATE = [107, 119, 133]; // #6B7785

    // 0. Page background
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, 210, 297, 'F');

    // 1. Header band (navy)
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, 210, 45, 'F');
    // gold accent line under header
    doc.setFillColor(...GOLD);
    doc.rect(0, 45, 210, 1.5, 'F');

    // 2. Eyebrow + title in header
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...GOLD);
    doc.text('DEEPER LIFE CAMPUS FELLOWSHIP  \u00B7  LCU', 20, 16);

    doc.setFontSize(24);
    doc.setTextColor(...CREAM);
    doc.text(retreat.name, 35, 32);

    // Logo (top-left of header)
    const loadImageAsDataURL = (src) =>
      new Promise((resolve) => {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          const c = document.createElement('canvas');
          c.width = logoImg.width;
          c.height = logoImg.height;
          c.getContext('2d').drawImage(logoImg, 0, 0);
          resolve(c.toDataURL('image/png'));
        };
        logoImg.onerror = () => resolve(null);
        logoImg.src = src;
      });

    const logoData = await loadImageAsDataURL('/logo.png');
    if (logoData) {
      doc.addImage(logoData, 'PNG', 18, 12, 14, 14);
    }

    // 3. Details card below header
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(20, 58, 170, 28, 3, 3, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.roundedRect(20, 58, 170, 28, 3, 3, 'S');

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(retreat.theme || 'Retreat Program', 28, 70);

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...SLATE);
    doc.text(`${retreat.start_date}  to  ${retreat.end_date}`, 28, 78);

    doc.setFont('times', 'bold');
    doc.setTextColor(...MAROON);
    doc.text(`CODE: ${retreat.code}`, 145, 78);

    // 4. QR section heading
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...NAVY);
    doc.text('Scan to Register', 105, 100, { align: 'center' });

    // 5. QR code with gold border box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(55, 108, 100, 100, 4, 4, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1);
    doc.roundedRect(55, 108, 100, 100, 4, 4, 'S');

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngData = canvas.toDataURL("image/png");

      // QR image inside the border box, centered (90mm x 90mm)
      doc.addImage(pngData, 'PNG', 60, 113, 90, 90);

      // 6. Footer code repeat + closing line
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...MAROON);
      doc.text(`Registration Code: ${retreat.code}`, 105, 222, { align: 'center' });

      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(...SLATE);
      doc.text('Present this card at the registration desk or scan to register online.', 105, 232, { align: 'center' });

      // bottom navy strip
      doc.setFillColor(...NAVY);
      doc.rect(0, 285, 210, 12, 'F');
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...GOLD);
      doc.text('Deeper Life Campus Fellowship, Lead City University', 105, 292, { align: 'center' });

      doc.save(`${retreat.name}_Registration_Card.pdf`);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

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

  const handleAddRetreat = async () => {
    if (!newRetreat.name || !newRetreat.code) {
      toast.warning("Please fill in the Name and Code fields.");
      return;
    }
    try {
      await apiService.postProgram(newRetreat);
      await fetchRetreats();
      setNewRetreat({ name: '', theme: '', code: '', start_date: '', end_date: '' });
      setShowAddRetreat(false);
      toast.success("Retreat created successfully!");
    } catch (err) {
      toast.error("Failed to save retreat.");
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
            <p className="text-[#6B7785]">Manage sessions for {selectedRetreat.name}.</p>
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
        <button onClick={() => setShowAddRetreat(true)} className="bg-[#6E2C3A] text-[#FAF6EE] px-6 py-3 rounded-lg font-semibold hover:bg-[#8a3a4b] transition">
          + Add New Retreat
        </button>
      </div>

      {showAddRetreat && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-[#1C2541]/10 mb-8">
          <h3 className="font-bold text-[#1C2541] mb-6">Define New Retreat</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border p-3 rounded-lg" placeholder="Retreat Name" value={newRetreat.name} onChange={e => setNewRetreat({...newRetreat, name: e.target.value})} />
            <input className="border p-3 rounded-lg" placeholder="Retreat Code" value={newRetreat.code} onChange={e => setNewRetreat({...newRetreat, code: e.target.value})} />
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
                className="p-2 bg-white border border-[#1C2541]/10 rounded-lg cursor-pointer hover:bg-[#FAF6EE] transition"
                onClick={() => generateRetreatPDF(r)}
                title="Download PDF Report"
              >
                <QRCodeSVG 
                  ref={(el) => (qrRefs.current[r.id] = el)}
                  value={`${window.location.origin}/register?retreat_code=${r.code}`}
                  size={48} 
                />
              </div>
              <button onClick={() => setSelectedRetreat(r)} className="bg-[#1C2541] text-[#FAF6EE] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2a3a63]">
                Manage Sessions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}