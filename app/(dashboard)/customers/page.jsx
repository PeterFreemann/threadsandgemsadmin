import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import { formatMoney, formatDate } from '@/lib/format';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { Table, Td } from '@/components/Table';

export default async function CustomersPage({ searchParams }) {
  await requirePermission('customers:view');
  const sp = await searchParams;
  const filters = { q: sp.q || '', page: sp.page || '1' };
  const { data, error } = await tryApi('/api/admin/customers', { searchParams: filters });

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has placed an order, most recent first." />
      <form className="flex gap-3 mb-5" role="search">
        <input name="q" defaultValue={filters.q} placeholder="Name or email" aria-label="Search customers" className="field max-w-xs" />
        <button className="px-4 py-2 rounded-md bg-espresso text-white text-sm">Search</button>
      </form>

      {error ? (
        <ErrorNotice message={error} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No customers found" />
      ) : (
        <>
          <Table head={['Customer', 'Orders', 'Total spent', 'Last order', '']}>
            {data.items.map((c) => (
              <tr key={c.email} className="hover:bg-stone-50">
                <Td>
                  <div className="flex items-center gap-3">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-gold-wash text-gold-deep text-xs flex items-center justify-center">
                        {(c.name || c.email)[0].toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-espresso">{c.name || 'Guest'}</p>
                      <p className="text-xs text-stone-500">{c.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="tabular-nums">{c.ordersCount}</Td>
                <Td className="tabular-nums">{formatMoney(c.totalSpentPence)}</Td>
                <Td className="text-stone-600 whitespace-nowrap">{formatDate(c.lastOrderAt)}</Td>
                <Td>
                  <Link href={`/orders?q=${encodeURIComponent(c.email)}`} className="text-sm text-gold-deep hover:underline whitespace-nowrap">
                    View orders
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
          <Pagination page={data.page} pages={data.pages} total={data.total} basePath="/customers" searchParams={filters} />
        </>
      )}
    </>
  );
}
