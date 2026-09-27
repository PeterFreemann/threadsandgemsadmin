import { FULFILMENT_STATUSES, PAYMENT_STATUSES, PRODUCT_STATUSES } from '@/lib/format';

const TONES = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  paid: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  failed: 'bg-rose-50 text-rose-800 ring-rose-200',
  refunded: 'bg-stone-100 text-stone-700 ring-stone-200',
  partially_refunded: 'bg-stone-100 text-stone-700 ring-stone-200',
  unfulfilled: 'bg-gold-wash text-gold-deep ring-gold/40',
  processing: 'bg-sky-50 text-sky-800 ring-sky-200',
  shipped: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-stone-100 text-stone-600 ring-stone-200',
  returned: 'bg-rose-50 text-rose-800 ring-rose-200',
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  draft: 'bg-stone-100 text-stone-700 ring-stone-200',
  archived: 'bg-stone-100 text-stone-500 ring-stone-200',
  new: 'bg-gold-wash text-gold-deep ring-gold/40',
  replied: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
};

const LABELS = Object.fromEntries(
  [...PAYMENT_STATUSES, ...FULFILMENT_STATUSES, ...PRODUCT_STATUSES].map((s) => [s.value, s.label])
);

export default function StatusBadge({ status }) {
  if (!status) return null;
  const label = LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ring-1 ring-inset whitespace-nowrap ${
        TONES[status] || 'bg-stone-100 text-stone-700 ring-stone-200'
      }`}
    >
      {label}
    </span>
  );
}
