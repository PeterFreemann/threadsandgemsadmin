'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/api-client';
import { ROLES, ROLE_LABELS } from '@/lib/roles';

const ROLE_HELP = {
  super_admin: 'Everything, including settings and the team',
  admin: 'Products, orders and refunds',
  staff: 'View and ship orders, answer messages',
};

export default function TeamManager({ members, currentUserId }) {
  const api = useApi();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.STAFF);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function run(fn, success) {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage({ ok: true, text: success });
      router.refresh();
      return true;
    } catch (err) {
      setMessage({ ok: false, text: err.message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage({ ok: false, text: 'Enter a valid email address.' });
    const ok = await run(
      () => api('/api/admin/team', { method: 'POST', body: { email: email.trim().toLowerCase(), role } }),
      `${email} can now sign in as ${ROLE_LABELS[role].toLowerCase()}.`
    );
    if (ok) setEmail('');
  }

  const changeRole = (m, newRole) =>
    run(() => api(`/api/admin/team/${m.userId}`, { method: 'PATCH', body: { role: newRole } }), `${m.email} is now ${ROLE_LABELS[newRole].toLowerCase()}.`);

  const removeAccess = (m) => {
    if (!confirm(`Remove admin access for ${m.email}? Their shopping account stays.`)) return;
    run(() => api(`/api/admin/team/${m.userId}`, { method: 'PATCH', body: { role: null } }), `Removed ${m.email}.`);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <form onSubmit={add} className="bg-white border border-stone-200 rounded-lg p-5">
        <h2 className="font-medium text-espresso">Add a team member</h2>
        <p className="text-sm text-stone-500 mb-4">They need to create an account on the store first, using this email.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="team-email" className="sr-only">Email</label>
          <input id="team-email" type="email" className="field" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="team-role" className="sr-only">Role</label>
          <select id="team-role" className="field sm:w-40" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.values(ROLES).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button disabled={busy} className="px-4 py-2 rounded-md bg-espresso text-white text-sm whitespace-nowrap disabled:opacity-50">Give access</button>
        </div>
        <p className="text-xs text-stone-500 mt-2">{ROLE_HELP[role]}.</p>
      </form>

      <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100">
        {members.map((m) => {
          const isMe = m.userId === currentUserId;
          return (
            <li key={m.userId} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-espresso">{m.name || m.email}{isMe && <span className="text-stone-500"> (you)</span>}</p>
                <p className="text-sm text-stone-500 truncate">{m.email}</p>
              </div>
              {isMe ? (
                <span className="text-sm text-gold-deep">{ROLE_LABELS[m.role]}</span>
              ) : (
                <div className="flex items-center gap-3">
                  <label htmlFor={`role-${m.userId}`} className="sr-only">Role for {m.email}</label>
                  <select id={`role-${m.userId}`} disabled={busy} className="field w-40" value={m.role} onChange={(e) => changeRole(m, e.target.value)}>
                    {Object.values(ROLES).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                  <button disabled={busy} onClick={() => removeAccess(m)} className="text-sm text-rose-700 hover:underline whitespace-nowrap">Remove</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {message && <p role="status" className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{message.text}</p>}
    </div>
  );
}
