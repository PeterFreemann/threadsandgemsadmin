import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import { can } from '@/lib/roles';
import { formatMoney, formatDateTime, SHIPPING_COUNTRIES } from '@/lib/format';
import ErrorNotice from '@/components/ErrorNotice';
import StatusBadge from '@/components/StatusBadge';
import Card from '@/components/Card';
import OrderActions from '@/components/OrderActions';

export default async function OrderDetailPage({ params }) {
  const { role } = await requirePermission('orders:view');
  const { id } = await params;
  const { data: order, error } = await tryApi(`/api/admin/orders/${id}`);

  if (error) {
    return (
      <>
        <BackLink />
        <ErrorNotice message={error} />
      </>
    );
  }

  const a = order.shippingAddress || {};
  const country = SHIPPING_COUNTRIES.find((c) => c.code === a.country)?.name || a.country;

  return (
    <>
      <BackLink />
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h1 className="text-2xl md:text-3xl font-medium text-espresso">{order.orderNumber}</h1>
        <StatusBadge status={order.paymentStatus} />
        <StatusBadge status={order.fulfilmentStatus} />
        <p className="text-stone-500 text-sm w-full">Placed {formatDateTime(order.createdAt)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Items">
            <ul className="divide-y divide-stone-100 -my-3">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-4 py-3">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="w-14 h-16 object-cover rounded bg-stone-100" />
                  ) : (
                    <div className="w-14 h-16 rounded bg-stone-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-espresso">{item.name}</p>
                    <p className="text-sm text-stone-500">
                      {item.size ? `Size ${item.size}, ` : ''}
                      {item.quantity} × {formatMoney(item.unitPricePence, order.currency)}
                    </p>
                  </div>
                  <p className="tabular-nums">{formatMoney(item.unitPricePence * item.quantity, order.currency)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-5 pt-4 border-t border-stone-200 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatMoney(order.subtotalPence, order.currency)} />
              <Row label="Shipping" value={order.shippingPence ? formatMoney(order.shippingPence, order.currency) : 'Free'} />
              <Row label="VAT" value={formatMoney(order.vatPence, order.currency)} />
              {order.refundedPence > 0 && (
                <Row label="Refunded" value={`−${formatMoney(order.refundedPence, order.currency)}`} />
              )}
              <div className="flex justify-between pt-2 text-base font-medium text-espresso">
                <dt>Total paid</dt>
                <dd className="tabular-nums">{formatMoney(order.totalPence, order.currency)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Timeline">
            {order.events?.length ? (
              <ol className="space-y-4">
                {[...order.events].reverse().map((e, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-gold shrink-0" aria-hidden />
                    <div>
                      <p className="text-espresso">{e.message}</p>
                      <p className="text-stone-500">
                        {formatDateTime(e.createdAt)}
                        {e.by ? `, by ${e.by}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-stone-500">No activity recorded yet.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="text-espresso">{order.customerName}</p>
            <a href={`mailto:${order.email}`} className="text-sm text-gold-deep hover:underline break-all">{order.email}</a>
            {order.phone && <p className="text-sm text-stone-600 mt-1">{order.phone}</p>}
            <Link href={`/orders?q=${encodeURIComponent(order.email)}`} className="block text-sm text-stone-600 hover:text-espresso mt-3">
              See their other orders
            </Link>
          </Card>

          <Card title="Ship to">
            <address className="not-italic text-sm text-stone-700 leading-relaxed">
              {order.customerName}<br />
              {a.line1}<br />
              {a.line2 && <>{a.line2}<br /></>}
              {a.city} {a.postalCode}<br />
              {country}
            </address>
          </Card>

          <OrderActions order={order} canRefund={can(role, 'orders:refund')} />
        </div>
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-espresso mb-4">
      <ArrowLeft className="w-4 h-4" aria-hidden /> Orders
    </Link>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-stone-600">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
