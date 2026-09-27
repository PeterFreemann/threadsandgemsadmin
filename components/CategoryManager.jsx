'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/api-client';
import { slugify } from '@/lib/format';

export default function CategoryManager({ categories, canEdit }) {
  const api = useApi();
  const router = useRouter();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

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
    if (!name.trim()) return setMessage({ ok: false, text: 'Enter a category name.' });
    const ok = await run(
      () => api('/api/admin/categories', { method: 'POST', body: { name: name.trim(), slug: slugify(name) } }),
      `Added ${name.trim()}.`
    );
    if (ok) setName('');
  }

  async function rename(cat) {
    if (!editing.name.trim()) return;
    const ok = await run(
      () => api(`/api/admin/categories/${cat._id}`, { method: 'PATCH', body: { name: editing.name.trim(), slug: slugify(editing.name) } }),
      'Category renamed.'
    );
    if (ok) setEditing(null);
  }

  async function remove(cat) {
    if (!confirm(`Delete the ${cat.name} category?`)) return;
    await run(() => api(`/api/admin/categories/${cat._id}`, { method: 'DELETE' }), `Deleted ${cat.name}.`);
  }

  async function reorder(index, dir) {
    const ids = categories.map((c) => c._id);
    const [id] = ids.splice(index, 1);
    ids.splice(index + dir, 0, id);
    await run(() => api('/api/admin/categories/order', { method: 'PUT', body: { ids } }), 'Order saved.');
  }

  return (
    <div className="max-w-2xl">
      {canEdit && (
        <form onSubmit={add} className="flex gap-2 mb-6">
          <label htmlFor="new-cat" className="sr-only">New category name</label>
          <input id="new-cat" className="field" placeholder="New category, e.g. Aso-Oke" value={name} onChange={(e) => setName(e.target.value)} />
          <button disabled={busy} className="px-4 rounded-md bg-espresso text-white text-sm whitespace-nowrap disabled:opacity-50">Add category</button>
        </form>
      )}

      <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100">
        {categories.length === 0 && <li className="p-5 text-sm text-stone-500">No categories yet.</li>}
        {categories.map((cat, i) => (
          <li key={cat._id} className="flex items-center gap-3 px-4 py-3">
            {editing?._id === cat._id ? (
              <>
                <label htmlFor={`edit-${cat._id}`} className="sr-only">Category name</label>
                <input id={`edit-${cat._id}`} className="field" value={editing.name} autoFocus onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <button onClick={() => rename(cat)} disabled={busy} className="text-sm text-espresso font-medium">Save</button>
                <button onClick={() => setEditing(null)} className="text-sm text-stone-500">Cancel</button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-espresso">{cat.name}</p>
                  <p className="text-xs text-stone-500">
                    {cat.productCount ?? 0} product{cat.productCount === 1 ? '' : 's'}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-3 text-sm">
                    <button disabled={busy || i === 0} onClick={() => reorder(i, -1)} className="text-stone-500 disabled:opacity-30" aria-label={`Move ${cat.name} up`}>↑</button>
                    <button disabled={busy || i === categories.length - 1} onClick={() => reorder(i, 1)} className="text-stone-500 disabled:opacity-30" aria-label={`Move ${cat.name} down`}>↓</button>
                    <button onClick={() => setEditing({ _id: cat._id, name: cat.name })} className="text-stone-700 hover:underline">Rename</button>
                    <button
                      onClick={() => remove(cat)}
                      disabled={busy || cat.productCount > 0}
                      title={cat.productCount > 0 ? 'Move its products to another category first' : undefined}
                      className="text-rose-700 hover:underline disabled:opacity-30 disabled:no-underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {message && <p role="status" className={`mt-3 text-sm ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{message.text}</p>}
    </div>
  );
}
