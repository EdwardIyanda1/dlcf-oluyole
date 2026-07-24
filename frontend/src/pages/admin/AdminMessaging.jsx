import { useState } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../api';

const FONT = { fontFamily: "'Fraunces', Georgia, serif" };
const CATEGORIES = ['Adult', 'Campus', 'Youth', 'Children'];

export default function AdminMessaging() {
  const [channel, setChannel]   = useState('email');
  const [category, setCategory] = useState('');
  const [search, setSearch]     = useState('');
  const [subject, setSubject]   = useState('');
  const [body, setBody]         = useState('');
  const [sending, setSending]   = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleSend = async () => {
    if (!body.trim()) { toast.error('Message body is required.'); return; }
    setSending(true);
    setLastResult(null);
    try {
      const res = await apiService.sendBulkMessage({
        channel,
        category: category || undefined,
        search: search || undefined,
        subject,
        body,
      });
      setLastResult(res.data);
      toast.success(`Sent to ${res.data.total_recipients} recipients`);
      setBody('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Admin Dashboard</p>
      <h2 className="text-3xl font-bold text-[#1C2541] mb-1" style={FONT}>Bulk Messaging</h2>
      <p className="text-[#6B7785] text-sm mb-8">Send SMS or email announcements to participants.</p>

      <div className="bg-white rounded-2xl border border-[#1C2541]/10 p-6 max-w-2xl shadow-sm">
        <label className="block text-xs font-bold text-[#6B7785] uppercase tracking-widest mb-2">Channel</label>
        <div className="flex gap-2 mb-6">
          {[['email', 'Email'], ['sms', 'SMS'], ['both', 'Both']].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setChannel(val)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                channel === val
                  ? 'bg-[#1C2541] text-[#FAF6EE] border-[#1C2541]'
                  : 'bg-white text-[#1C2541] border-[#1C2541]/15 hover:bg-[#FAF6EE]'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-[#6B7785] uppercase tracking-widest mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-[#1C2541]/15 bg-[#FAF6EE] p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#D4A857]"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#6B7785] uppercase tracking-widest mb-2">Search (name/school)</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Optional"
              className="w-full border border-[#1C2541]/15 bg-[#FAF6EE] p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#D4A857]"
            />
          </div>
        </div>

        {channel !== 'sms' && (
          <>
            <label className="block text-xs font-bold text-[#6B7785] uppercase tracking-widest mb-2">Subject (email only)</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-[#1C2541]/15 bg-[#FAF6EE] p-2.5 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-[#D4A857]"
            />
          </>
        )}

        <label className="block text-xs font-bold text-[#6B7785] uppercase tracking-widest mb-2">Message</label>
        <textarea
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Reminder: Day 2 morning session starts at 6am sharp…"
          className="w-full border border-[#1C2541]/15 bg-[#FAF6EE] p-3 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-[#D4A857]"
        />

        <button
          disabled={sending}
          onClick={handleSend}
          className={`px-6 py-3 rounded-lg font-bold transition ${
            sending ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1C2541] text-[#FAF6EE] hover:bg-[#2a3a63]'
          }`}
        >
          {sending ? 'Sending…' : 'Send Message'}
        </button>

        {lastResult && (
          <div className="mt-5 text-sm text-[#6B7785] bg-[#FAF6EE] rounded-lg p-3">
            Recipients: <b className="text-[#1C2541]">{lastResult.total_recipients}</b>
            {' · '}SMS sent: <b className="text-[#1C2541]">{lastResult.sms_sent}</b>
            {' · '}Email sent: <b className="text-[#1C2541]">{lastResult.email_sent}</b>
          </div>
        )}
      </div>
    </div>
  );
}