import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import { formatMoney, formatDate } from '@/lib/format';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import StatusBadge from '@/components/StatusBadge';
import Card from '@/components/Card';

export default async function OverviewPage() {
  await requirePermission('dashboard:view');
  const { data, error } = await tryApi('/api/admin/stats');

  return (
    <>
      <PageHeader title="Overview" description="The last 30 days at Threads & Gems." />
      {error ? (
        <ErrorNotice message={error} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <Link
              href="/orders?fulfilment=unfulfilled&payment=paid"
              className="bg-espresso text-white rounded-lg p-5 hover:bg-espresso-soft transition-colors"
            >
              <p className="text-stone-300 text-sm">Paid orders waiting to be packed</p>
              <p className="text-5xl font-light text-gold mt-2">{data.toFulfilCount}</p>
              <p className="text-sm text-stone-300 mt-3">Open the packing list</p>
            </Link>
            <Stat label="Revenue" value={formatMoney(data.revenue30dPence)} />
            <Stat label="Orders" value={data.orders30d} />
            <Stat
              label="Low on stock"
              value={data.lowStockCount}
              tone={data.lowStockCount > 0 ? 'text-rose-700' : undefined}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card
              className="lg:col-span-2"
              title="Latest orders"
              action={<Link href="/orders" className="text-sm text-gold-deep hover:underline">All orders</Link>}
            >
              {data.recentOrders?.length ? (
                <ul className="divide-y divide-stone-100 -my-2">
                  {data.recentOrders.map((o) => (
                    <li key={o._id}>
                      <Link href={`/orders/${o._id}`} className="flex items-center gap-4 py-3 hover:bg-stone-50 -mx-2 px-2 rounded">
                        <div className="min-w-0 flex-1">
                          <p className="text-espresso">{o.orderNumber}</p>
                          <p className="text-sm text-stone-500 truncate">
                            {o.customerName || o.email}, {formatDate(o.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={o.fulfilmentStatus} />
                        <span className="w-20 text-right tabular-nums">{formatMoney(o.totalPence, o.currency)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-stone-500 text-sm">No orders yet.</p>
              )}
            </Card>

            <div className="space-y-6">
              <Card title="Low stock">
                {data.lowStock?.length ? (
                  <ul className="space-y-3">
                    {data.lowStock.map((p) => (
                      <li key={p._id} className="flex justify-between gap-3 text-sm">
                        <Link href={`/products/${p._id}`} className="text-espresso hover:underline truncate">{p.name}</Link>
                        <span className={p.stock === 0 ? 'text-rose-700' : 'text-amber-700'}>
                          {p.stock === 0 ? 'Sold out' : `${p.stock} left`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-stone-500 text-sm">Everything is well stocked.</p>
                )}
              </Card>

              <Card title="Best sellers">
                {data.topProducts?.length ? (
                  <ol className="space-y-3">
                    {data.topProducts.map((p) => (
                      <li key={p.productId} className="flex justify-between gap-3 text-sm">
                        <span className="truncate">{p.name}</span>
                        <span className="text-stone-500 whitespace-nowrap">{p.quantity} sold</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-stone-500 text-sm">Sales will show here.</p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5">
      <p className="text-stone-500 text-sm">{label}</p>
      <p className={`text-3xl font-light mt-2 tabular-nums ${tone || 'text-espresso'}`}>{value}</p>
    </div>
  );
}
