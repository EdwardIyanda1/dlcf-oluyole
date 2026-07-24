import { useState, useEffect } from 'react';
import apiService, { isCanceled } from '../../api';
import ExportButtons from '../../components/ExportButtons';

const PAGE_SIZE = 50;

function Pagination({ page, setPage, count, pageSize }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  const windowSize = 2;
  const pages = [];
  for (let p = Math.max(1, page - windowSize); p <= Math.min(totalPages, page + windowSize); p++) {
    pages.push(p);
  }

  const btn = (active) =>
    `w-9 h-9 rounded-lg text-sm font-semibold transition ${
      active ? 'bg-[#1C2541] text-[#FAF6EE]' : 'bg-white text-[#1C2541] border border-[#1C2541]/15 hover:bg-[#FAF6EE]'
    }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <p className="text-xs text-[#6B7785]">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)} of {count}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className={`${btn(false)} disabled:opacity-30 disabled:cursor-not-allowed`}
          aria-label="First page"
        >
          «
        </button>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`${btn(false)} disabled:opacity-30 disabled:cursor-not-allowed`}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages[0] > 1 && <span className="px-1 text-[#6B7785]">…</span>}
        {pages.map((p) => (
          <button key={p} onClick={() => setPage(p)} className={btn(p === page)}>
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && <span className="px-1 text-[#6B7785]">…</span>}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className={`${btn(false)} disabled:opacity-30 disabled:cursor-not-allowed`}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          className={`${btn(false)} disabled:opacity-30 disabled:cursor-not-allowed`}
          aria-label="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
}

export default function AdminParticipants() {
  const [participants, setParticipants] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    apiService
      .getParticipants(
        { page, page_size: PAGE_SIZE, search: debouncedSearch || undefined },
        { signal: controller.signal }
      )
      .then((res) => {
        const data = res.data;
        const results = data.results ?? data;
        setParticipants(results);
        setTotal(data.count ?? results.length);
        setLoading(false);
      })
      .catch((err) => {
        if (isCanceled(err)) return;
        console.error(err);
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [page, debouncedSearch]);

  return (
    <div className="bg-[#FAF6EE] min-h-full">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-[#6E2C3A] text-xs font-semibold tracking-[0.25em] uppercase mb-1">Registry</p>
          <h2 className="text-3xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Registered Participants
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl border border-[#1C2541]/10 px-4 py-2 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-[#6B7785]">Total</p>
            <p className="text-2xl font-bold text-[#1C2541]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              {total}
            </p>
          </div>
          <ExportButtons
            onExcel={() => apiService.exportParticipantsExcel({ search: debouncedSearch || undefined })}
            onPdf={() => apiService.exportParticipantsPdf({ search: debouncedSearch || undefined })}
            excelName="participant_registry.xlsx"
            pdfName="participant_registry.pdf"
          />
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or school…"
        className="w-full border border-[#1C2541]/15 bg-white p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-[#D4A857] transition"
      />

      <div className="bg-white rounded-2xl border border-[#1C2541]/10 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#1C2541]">
            <tr>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Name</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">School</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Category</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Sex</th>
              <th className="p-4 text-xs font-semibold tracking-widest uppercase text-[#FAF6EE]/70">Phone</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-[#6B7785]">Loading&hellip;</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="p-8 text-center text-[#6E2C3A]">Failed to load participants.</td></tr>
            ) : participants.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-[#6B7785]">No participants found.</td></tr>
            ) : (
              participants.map((p) => (
                <tr key={p.id} className="border-b border-[#1C2541]/5 last:border-0 hover:bg-[#FAF6EE]">
                  <td className="p-4 font-medium text-[#1C2541]">{p.full_name}</td>
                  <td className="p-4 text-[#6B7785]">{p.school || '—'}</td>
                  <td className="p-4">
                    <span className="text-xs font-semibold uppercase tracking-wide bg-[#D4A857]/15 text-[#6E2C3A] px-2 py-1 rounded-full">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-4 text-[#6B7785]">{p.sex === 'M' ? 'Male' : 'Female'}</td>
                  <td className="p-4 text-[#6B7785] font-mono text-sm">{p.phone_number || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} setPage={setPage} count={total} pageSize={PAGE_SIZE} />
    </div>
  );
}