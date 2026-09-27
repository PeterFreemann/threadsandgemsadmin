'use client';

import { Download } from 'lucide-react';

export default function ExportCsvButton({ rows }) {
  function download() {
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['email', 'source', 'signed_up'], ...rows.map((r) => [r.email, r.source, r.createdAt])];
    const csv = lines.map((l) => l.map(escape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={download} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-stone-300 bg-white text-sm hover:border-espresso">
      <Download className="w-4 h-4" aria-hidden /> Download CSV
    </button>
  );
}
