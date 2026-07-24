import { useState } from 'react';
import { toast } from 'react-toastify';
import { downloadBlob } from '../api';

/**
 * Drop-in export buttons for any admin list/report page.
 *
 * <ExportButtons
 *   onExcel={() => apiService.exportParticipantsExcel()}
 *   onPdf={() => apiService.exportParticipantsPdf()}
 *   excelName="participants.xlsx"
 *   pdfName="participants.pdf"
 * />
 */
export default function ExportButtons({ onExcel, onPdf, excelName = 'export.xlsx', pdfName = 'export.pdf' }) {
  const [busy, setBusy] = useState(null); // 'excel' | 'pdf' | null

  const run = async (kind, fn, filename) => {
    setBusy(kind);
    try {
      const res = await fn();
      downloadBlob(res.data, filename);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => run('excel', onExcel, excelName)}
        disabled={busy !== null}
        className="px-4 py-2 bg-[#1C2541] text-[#FAF6EE] rounded-lg text-sm font-semibold hover:bg-[#2a3a63] transition disabled:opacity-60"
      >
        {busy === 'excel' ? 'Exporting…' : 'Export Excel'}
      </button>
      <button
        onClick={() => run('pdf', onPdf, pdfName)}
        disabled={busy !== null}
        className="px-4 py-2 border border-[#1C2541]/15 text-[#1C2541] rounded-lg text-sm font-semibold hover:bg-[#FAF6EE] transition disabled:opacity-60"
      >
        {busy === 'pdf' ? 'Exporting…' : 'Export PDF'}
      </button>
    </div>
  );
}