import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiService from '../api';
import Logo from '../components/Logo';

export default function CheckInPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('dlcf_user') || 'null');

  const lookup = async (value) => {
    setError('');
    try {
      const res = await apiService.checkInByCode(value);
      setResult(res.data);
    } catch {
      setError('Code not found. Check it and try again.');
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) lookup(code.trim());
  };

  // Start/stop QR scanner
  useEffect(() => {
    if (!scanning) return;
    const qr = new Html5Qrcode('qr-reader');
    scannerRef.current = qr;

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 220 },
      (decodedText) => {
        qr.stop();
        setScanning(false);
        lookup(decodedText);
      },
      () => {} // ignore frame errors
    ).catch(() => setError('Could not access camera.'));

    return () => {
      qr.stop().catch(() => {});
    };
  }, [scanning]);

  return (
    <div className="min-h-screen bg-[#FAF6EE] py-12 px-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={56} withText={false} />
          </div>
          <p className="text-[#6E2C3A] text-sm font-semibold tracking-[0.25em] uppercase mb-2">
            Registration Unit
          </p>
          <h1
            className="text-3xl font-bold text-[#1C2541]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {user ? `Welcome, ${user.full_name.split(' ')[0]}` : 'Check In'}
          </h1>
          {user && (
            <p className="text-[#6B7785] mt-1">
              Your code: <span className="font-mono font-bold text-[#1C2541]">{user.code}</span>
            </p>
          )}
        </div>

        {!result && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#1C2541]/10">
            {/* QR Scanner */}
            <div className="mb-6">
              {scanning ? (
                <div id="qr-reader" className="rounded-lg overflow-hidden" />
              ) : (
                <button
                  onClick={() => setScanning(true)}
                  className="w-full bg-[#1C2541] text-[#FAF6EE] py-3 rounded-lg font-bold hover:bg-[#2a3a63] transition"
                >
                  Scan QR Code
                </button>
              )}
              {scanning && (
                <button
                  onClick={() => setScanning(false)}
                  className="w-full mt-3 text-sm text-[#6B7785] underline"
                >
                  Cancel scan
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-[#1C2541]/10" />
              <span className="text-xs text-[#6B7785] uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-[#1C2541]/10" />
            </div>

            {/* Manual code entry */}
            <form onSubmit={handleCodeSubmit}>
              <label className="block text-xs font-semibold text-[#6B7785] uppercase tracking-wider mb-1">
                Enter your code
              </label>
              <input
                className="w-full border border-[#1C2541]/15 bg-[#FAF6EE] focus:bg-white p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#D4A857] font-mono tracking-widest"
                placeholder="DLCF-1001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button className="w-full border border-[#1C2541] text-[#1C2541] py-3 rounded-lg font-bold hover:bg-[#1C2541]/5 transition">
                Submit Code
              </button>
            </form>

            {error && <p className="text-[#6E2C3A] text-sm mt-4 text-center">{error}</p>}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#1C2541]/10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#D4A857]/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-[#6E2C3A] text-2xl">✓</span>
            </div>
            <h2
              className="text-2xl font-bold text-[#1C2541] mb-1"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {result.full_name}
            </h2>
            <p className="text-[#6B7785] mb-4">{result.school}</p>
            <div className="flex justify-center gap-3 mb-6">
              <span className="text-xs font-semibold uppercase tracking-wide bg-[#D4A857]/15 text-[#6E2C3A] px-3 py-1 rounded-full">
                {result.category}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide bg-[#1C2541]/5 text-[#1C2541] px-3 py-1 rounded-full">
                {result.sex === 'M' ? 'Male' : 'Female'}
              </span>
            </div>
            <p className="text-sm text-[#6B7785] mb-6">
              These details have been sent to the registration unit. Hand any
              physical items to the usher and proceed inside.
            </p>
            <button
              onClick={() => { setResult(null); setCode(''); }}
              className="text-[#6E2C3A] font-semibold underline text-sm"
            >
              Check in someone else
            </button>
          </div>
        )}
      </div>
    </div>
  );
}