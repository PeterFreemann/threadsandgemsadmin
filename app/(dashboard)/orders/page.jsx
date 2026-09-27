import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import { formatMoney, formatDate, PAYMENT_STATUSES, FULFILMENT_STATUSES } from '@/lib/format';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { Table, Td } from '@/components/Table';

export default async function OrdersPage({ searchParams }) {
  await requirePermission('orders:view');
  const sp = await searchParams;
  const filters = { q: sp.q || '', payment: sp.payment || '', fulfilment: sp.fulfilment || '', page: sp.page || '1' };
  const { data, error } = await tryApi('/api/admin/orders', { searchParams: filters });

  return (
    <>
      <PageHeader title="Orders" description="Search, pack and ship customer orders." />

      <form className="flex flex-wrap gap-3 mb-5" role="search">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Order number, name or email"
          aria-label="Search orders"
          className="field max-w-xs"
        />
        <select name="payment" defaultValue={filters.payment} aria-label="Payment" className="field w-auto">
          <option value="">Any payment</option>
          {PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select name="fulfilment" defaultValue={filters.fulfilment} aria-label="Fulfilment" className="field w-auto">
          <option value="">Any fulfilment</option>
          {FULFILMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="px-4 py-2 rounded-md bg-espresso text-white text-sm">Filter</button>
        {(filters.q || filters.payment || filters.fulfilment) && (
          <Link href="/orders" className="px-3 py-2 text-sm text-stone-600 hover:text-espresso">Clear</Link>
        )}
      </form>

      {error ? (
        <ErrorNotice message={error} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No orders match these filters">Try clearing the search or picking another status.</EmptyState>
      ) : (
        <>
          <Table head={['Order', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Fulfilment']}>
            {data.items.map((o) => (
              <tr key={o._id} className="hover:bg-stone-50">
                <Td>
                  <Link href={`/orders/${o._id}`} className="text-espresso font-medium hover:underline">
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-stone-600">{formatDate(o.createdAt)}</Td>
                <Td>
                  <p>{o.customerName}</p>
                  <p className="text-stone-500 text-xs">{o.email}</p>
                </Td>
                <Td className="text-stone-600">{o.items?.reduce((n, i) => n + i.quantity, 0)}</Td>
                <Td className="tabular-nums whitespace-nowrap">{formatMoney(o.totalPence, o.currency)}</Td>
                <Td><StatusBadge status={o.paymentStatus} /></Td>
                <Td><StatusBadge status={o.fulfilmentStatus} /></Td>
              </tr>
            ))}
          </Table>
          <Pagination page={data.page} pages={data.pages} total={data.total} basePath="/orders" searchParams={filters} />
        </>
      )}
    </>
  );
}
