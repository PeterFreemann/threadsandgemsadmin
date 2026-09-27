'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/api-client';
import { FULFILMENT_STATUSES, formatMoney, penceToPounds, poundsToPence } from '@/lib/format';
import Card from './Card';

export default function OrderActions({ order, canRefund }) {
  const api = useApi();
  const router = useRouter();
  const [form, setForm] = useState({
    fulfilmentStatus: order.fulfilmentStatus,
    carrier: order.carrier || '',
    trackingNumber: order.trackingNumber || '',
    adminNotes: order.adminNotes || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const refundable = (order.totalPence || 0) - (order.refundedPence || 0);
  const [refundAmount, setRefundAmount] = useState(penceToPounds(refundable));
  const [refunding, setRefunding] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function save(e) {
    e.preventDefault();
    if (form.fulfilmentStatus === 'shipped' && !form.trackingNumber.trim()) {
      if (!confirm('Mark as shipped without a tracking number?')) return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api(`/api/admin/orders/${order._id}`, { method: 'PATCH', body: form });
      setMessage({ ok: true, text: 'Order updated.' });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function refund() {
    const amountPence = poundsToPence(refundAmount);
    if (!amountPence || amountPence <= 0 || amountPence > refundable) {
      setMessage({ ok: false, text: `Enter an amount between £0.01 and ${formatMoney(refundable)}.` });
      return;
    }
    if (!confirm(`Refund ${formatMoney(amountPence)} to the customer's card? This can't be undone.`)) return;
    setRefunding(true);
    setMessage(null);
    try {
      await api(`/api/admin/orders/${order._id}/refund`, { method: 'POST', body: { amountPence } });
      setMessage({ ok: true, text: `Refunded ${formatMoney(amountPence)}.` });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setRefunding(false);
    }
  }

  const canRefundNow = canRefund && ['paid', 'partially_refunded'].includes(order.paymentStatus) && refundable > 0;

  return (
    <Card title="Fulfilment">
      <form onSubmit={save} className="space-y-4">
        <Field label="Status" id="fulfilmentStatus">
          <select id="fulfilmentStatus" className="field" value={form.fulfilmentStatus} onChange={set('fulfilmentStatus')}>
            {FULFILMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Carrier" id="carrier">
          <input id="carrier" className="field" placeholder="Royal Mail, DHL, DPD" value={form.carrier} onChange={set('carrier')} />
        </Field>
        <Field label="Tracking number" id="trackingNumber">
          <input id="trackingNumber" className="field" value={form.trackingNumber} onChange={set('trackingNumber')} />
        </Field>
        <Field label="Private note" id="adminNotes" hint="Only staff see this.">
          <textarea id="adminNotes" rows={3} className="field" value={form.adminNotes} onChange={set('adminNotes')} />
        </Field>
        <button disabled={saving} className="w-full py-2.5 rounded-md bg-espresso text-white text-sm disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {canRefundNow && (
        <div className="mt-6 pt-5 border-t border-stone-200">
          <p className="text-sm font-medium text-espresso">Refund</p>
          <p className="text-xs text-stone-500 mb-3">Up to {formatMoney(refundable)} goes back to the customer&apos;s card.</p>
          <div className="flex gap-2">
            <label htmlFor="refund" className="sr-only">Refund amount in pounds</label>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">£</span>
              <input id="refund" inputMode="decimal" className="field pl-7" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </div>
            <button
              type="button"
              onClick={refund}
              disabled={refunding}
              className="px-3 rounded-md border border-rose-300 text-rose-700 text-sm hover:bg-rose-50 disabled:opacity-50"
            >
              {refunding ? 'Refunding…' : 'Refund'}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className={`mt-4 text-sm ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{message.text}</p>
      )}
    </Card>
  );
}

function Field({ label, id, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-stone-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-stone-500 mt-1">{hint}</p>}
    </div>
  );
}
