import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// npm install qrcode.react
export default function QRCodeCard({ value, label, caption, size = 180 }) {
  const wrapRef = useRef(null);

  const handleDownload = () => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${(label || 'qr-code').replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#1C2541]/10 text-center inline-block">
      <div ref={wrapRef} className="flex justify-center mb-3">
        <QRCodeCanvas value={value} size={size} fgColor="#1C2541" level="M" includeMargin />
      </div>
      {label && <p className="text-sm font-mono font-bold text-[#1C2541]">{label}</p>}
      {caption && <p className="text-xs text-[#6B7785] mt-1 mb-3">{caption}</p>}
      <button
        onClick={handleDownload}
        className="text-xs font-semibold uppercase tracking-wide text-[#6E2C3A] underline mt-2"
      >
        Download PNG
      </button>
    </div>
  );
}