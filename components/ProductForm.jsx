'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/api-client';
import { PRODUCT_STATUSES, penceToPounds, poundsToPence, slugify } from '@/lib/format';
import ImageUploader from './ImageUploader';
import Card from './Card';

export default function ProductForm({ product, categories }) {
  const api = useApi();
  const router = useRouter();
  const isNew = !product;

  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    shortDescription: product?.shortDescription || '',
    details: product?.details || '',
    price: penceToPounds(product?.pricePence),
    compareAtPrice: penceToPounds(product?.compareAtPricePence),
    categoryId: product?.category?._id || product?.categoryId || '',
    stock: product?.stock ?? 0,
    status: product?.status || 'draft',
    featured: product?.featured || false,
    images: product?.images || [],
  });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const update = (key, value) => {
    const next = { ...form, [key]: value };
    if (key === 'name' && !slugTouched) next.slug = slugify(value);
    setForm(next);
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter a product name.';
    if (!form.slug.trim()) e.slug = 'Enter a web address.';
    const price = poundsToPence(form.price);
    if (!price || price <= 0) e.price = 'Enter a price above £0.';
    const compare = poundsToPence(form.compareAtPrice);
    if (compare !== null && compare <= price) e.compareAtPrice = 'The original price must be higher than the sale price.';
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Enter a whole number, 0 or more.';
    if (form.status === 'active' && form.images.length === 0) e.images = 'Add at least one photo before setting this live.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setMessage(null);

    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      shortDescription: form.shortDescription.trim(),
      details: form.details.trim(),
      pricePence: poundsToPence(form.price),
      compareAtPricePence: poundsToPence(form.compareAtPrice),
      categoryId: form.categoryId || null,
      stock: Number(form.stock),
      status: form.status,
      featured: form.featured,
      images: form.images.map(({ url, alt }) => ({ url, alt })),
    };

    try {
      if (isNew) {
        const created = await api('/api/admin/products', { method: 'POST', body });
        router.push(`/products/${created._id}`);
      } else {
        await api(`/api/admin/products/${product._id}`, { method: 'PATCH', body });
        setMessage({ ok: true, text: 'Product saved.' });
        router.refresh();
      }
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${product.name}"? Past orders keep their copy, but the product leaves the shop for good. Archiving hides it instead.`)) return;
    try {
      await api(`/api/admin/products/${product._id}`, { method: 'DELETE' });
      router.push('/products');
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Details">
          <div className="space-y-4">
            <Field label="Name" id="name" error={errors.name}>
              <input id="name" className="field" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Brocade Senator Set" />
            </Field>
            <Field label="Web address" id="slug" error={errors.slug} hint={`Shows as /product/${form.slug || 'your-product'}`}>
              <input
                id="slug"
                className="field"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); update('slug', slugify(e.target.value)); }}
              />
            </Field>
            <Field label="Short description" id="shortDescription" hint="One line shown on shop cards.">
              <input id="shortDescription" className="field" value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} />
            </Field>
            <Field label="About this piece" id="details" hint="Shown on the product page: fabric, fit, occasion.">
              <textarea id="details" rows={6} className="field" value={form.details} onChange={(e) => update('details', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="Photos">
          <ImageUploader images={form.images} onChange={(images) => update('images', images)} />
          {errors.images && <p className="text-sm text-rose-700 mt-3">{errors.images}</p>}
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Visibility">
          <div className="space-y-4">
            <Field label="Status" id="status">
              <select id="status" className="field" value={form.status} onChange={(e) => update('status', e.target.value)}>
                {PRODUCT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} className="accent-[#2C1810]" />
              Show on the homepage
            </label>
            <Field label="Category" id="categoryId">
              <select id="categoryId" className="field" value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Price and stock">
          <div className="space-y-4">
            <Field label="Price (£)" id="price" error={errors.price}>
              <input id="price" inputMode="decimal" className="field" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="45.00" />
            </Field>
            <Field label="Original price (£)" id="compareAtPrice" error={errors.compareAtPrice} hint="Optional. Fill in to show this piece as on sale.">
              <input id="compareAtPrice" inputMode="decimal" className="field" value={form.compareAtPrice} onChange={(e) => update('compareAtPrice', e.target.value)} />
            </Field>
            <Field label="In stock" id="stock" error={errors.stock}>
              <input id="stock" type="number" min="0" step="1" className="field" value={form.stock} onChange={(e) => update('stock', e.target.value)} />
            </Field>
          </div>
        </Card>

        <div className="space-y-3">
          <button disabled={saving} className="w-full py-2.5 rounded-md bg-espresso text-white disabled:opacity-50">
            {saving ? 'Saving…' : isNew ? 'Create product' : 'Save product'}
          </button>
          {message && <p role="status" className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{message.text}</p>}
          {!isNew && (
            <button type="button" onClick={remove} className="w-full py-2 text-sm text-rose-700 hover:underline">
              Delete product
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({ label, id, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-stone-700 mb-1">{label}</label>
      {children}
      {error ? <p className="text-xs text-rose-700 mt-1">{error}</p> : hint ? <p className="text-xs text-stone-500 mt-1">{hint}</p> : null}
    </div>
  );
}
