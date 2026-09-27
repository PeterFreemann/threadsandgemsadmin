'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/api-client';

export default function MessageActions({ message }) {
  const api = useApi();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function setStatus(status) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/messages/${message._id}`, { method: 'PATCH', body: { status } });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const replySubject = encodeURIComponent(`Re: ${message.subject || 'Your message to Threads & Gems'}`);

  return (
    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-stone-100 text-sm">
      <a
        href={`mailto:${message.email}?subject=${replySubject}`}
        onClick={() => message.status === 'new' && setStatus('replied')}
        className="px-3 py-1.5 rounded-md bg-espresso text-white"
      >
        Reply by email
      </a>
      {message.status !== 'replied' && (
        <button disabled={busy} onClick={() => setStatus('replied')} className="text-stone-700 hover:underline">Mark as replied</button>
      )}
      {message.status !== 'archived' ? (
        <button disabled={busy} onClick={() => setStatus('archived')} className="text-stone-500 hover:underline">Archive</button>
      ) : (
        <button disabled={busy} onClick={() => setStatus('new')} className="text-stone-500 hover:underline">Move back to new</button>
      )}
      {error && <span className="text-rose-700">{error}</span>}
    </div>
  );
}
