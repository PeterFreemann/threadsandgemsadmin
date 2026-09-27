import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import { can } from '@/lib/roles';
import { formatMoney, PRODUCT_STATUSES, LOW_STOCK_THRESHOLD } from '@/lib/format';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { Table, Td } from '@/components/Table';

export default async function ProductsPage({ searchParams }) {
  const { role } = await requirePermission('products:view');
  const canEdit = can(role, 'products:edit');
  const sp = await searchParams;
  const filters = { q: sp.q || '', status: sp.status || '', category: sp.category || '', page: sp.page || '1' };

  const [products, categories] = await Promise.all([
    tryApi('/api/admin/products', { searchParams: filters }),
    tryApi('/api/admin/categories'),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything in the shop, including drafts."
        actions={
          canEdit && (
            <Link href="/products/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-espresso text-white text-sm">
              <Plus className="w-4 h-4" aria-hidden /> Add product
            </Link>
          )
        }
      />

      <form className="flex flex-wrap gap-3 mb-5" role="search">
        <input name="q" defaultValue={filters.q} placeholder="Search by name" aria-label="Search products" className="field max-w-xs" />
        <select name="category" defaultValue={filters.category} aria-label="Category" className="field w-auto">
          <option value="">All categories</option>
          {categories.data?.items?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={filters.status} aria-label="Status" className="field w-auto">
          <option value="">Any status</option>
          {PRODUCT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="px-4 py-2 rounded-md bg-espresso text-white text-sm">Filter</button>
      </form>

      {products.error ? (
        <ErrorNotice message={products.error} />
      ) : products.data.items.length === 0 ? (
        <EmptyState title="No products found">
          {canEdit ? <Link href="/products/new" className="text-gold-deep underline">Add your first product</Link> : 'Try another search.'}
        </EmptyState>
      ) : (
        <>
          <Table head={['Product', 'Category', 'Price', 'Stock', 'Status']}>
            {products.data.items.map((p) => (
              <tr key={p._id} className="hover:bg-stone-50">
                <Td>
                  <div className="flex items-center gap-3">
                    {p.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" className="w-10 h-12 object-cover rounded bg-stone-100" />
                    ) : (
                      <div className="w-10 h-12 rounded bg-stone-100" />
                    )}
                    <div>
                      {canEdit ? (
                        <Link href={`/products/${p._id}`} className="text-espresso font-medium hover:underline">{p.name}</Link>
                      ) : (
                        <span className="text-espresso font-medium">{p.name}</span>
                      )}
                      {p.featured && (
                        <span className="flex items-center gap-1 text-xs text-gold-deep">
                          <Star className="w-3 h-3" aria-hidden /> On homepage
                        </span>
                      )}
                    </div>
                  </div>
                </Td>
                <Td className="text-stone-600">{p.category?.name || 'None'}</Td>
                <Td className="tabular-nums whitespace-nowrap">
                  {formatMoney(p.pricePence)}
                  {p.compareAtPricePence > p.pricePence && (
                    <span className="block text-xs text-stone-400 line-through">{formatMoney(p.compareAtPricePence)}</span>
                  )}
                </Td>
                <Td className={`tabular-nums ${p.stock === 0 ? 'text-rose-700' : p.stock <= LOW_STOCK_THRESHOLD ? 'text-amber-700' : ''}`}>
                  {p.stock === 0 ? 'Sold out' : p.stock}
                </Td>
                <Td><StatusBadge status={p.status} /></Td>
              </tr>
            ))}
          </Table>
          <Pagination page={products.data.page} pages={products.data.pages} total={products.data.total} basePath="/products" searchParams={filters} />
        </>
      )}
    </>
  );
}
