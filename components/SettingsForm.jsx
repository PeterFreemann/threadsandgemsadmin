'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/api-client';
import { penceToPounds, poundsToPence, SHIPPING_COUNTRIES } from '@/lib/format';
import Card from './Card';

export default function SettingsForm({ settings }) {
  const api = useApi();
  const router = useRouter();
  const [form, setForm] = useState({
    vatRatePercent: settings.vatRatePercent ?? 20,
    pricesIncludeVat: settings.pricesIncludeVat ?? true,
    freeShippingThreshold: penceToPounds(settings.freeShippingThresholdPence),
    flatShipping: penceToPounds(settings.flatShippingPence ?? 0),
    shippingCountries: settings.shippingCountries || ['GB'],
    contactEmail: settings.contactEmail || '',
    contactPhone: settings.contactPhone || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (key, value) => setForm({ ...form, [key]: value });
  const toggleCountry = (code) =>
    set('shippingCountries', form.shippingCountries.includes(code)
      ? form.shippingCountries.filter((c) => c !== code)
      : [...form.shippingCountries, code]);

  async function submit(e) {
    e.preventDefault();
    const vat = Number(form.vatRatePercent);
    if (!Number.isFinite(vat) || vat < 0 || vat > 100) return setMessage({ ok: false, text: 'VAT rate must be between 0 and 100.' });
    if (form.shippingCountries.length === 0) return setMessage({ ok: false, text: 'Pick at least one country you ship to.' });

    setSaving(true);
    setMessage(null);
    try {
      await api('/api/admin/settings', {
        method: 'PATCH',
        body: {
          vatRatePercent: vat,
          pricesIncludeVat: form.pricesIncludeVat,
          freeShippingThresholdPence: poundsToPence(form.freeShippingThreshold),
          flatShippingPence: poundsToPence(form.flatShipping) ?? 0,
          shippingCountries: form.shippingCountries,
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
        },
      });
      setMessage({ ok: true, text: 'Settings saved. Checkout uses them from the next order.' });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <Card title="VAT">
        <div className="space-y-4">
          <div>
            <label htmlFor="vat" className="block text-sm text-stone-700 mb-1">VAT rate (%)</label>
            <input id="vat" inputMode="decimal" className="field max-w-32" value={form.vatRatePercent} onChange={(e) => set('vatRatePercent', e.target.value)} />
          </div>
          <fieldset className="space-y-2 text-sm">
            <legend className="text-stone-700 mb-1">Product prices</legend>
            <label className="flex items-start gap-2">
              <input type="radio" name="vatmode" className="mt-1 accent-[#2C1810]" checked={form.pricesIncludeVat} onChange={() => set('pricesIncludeVat', true)} />
              <span>Include VAT. A £45 dress costs the customer £45.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="vatmode" className="mt-1 accent-[#2C1810]" checked={!form.pricesIncludeVat} onChange={() => set('pricesIncludeVat', false)} />
              <span>Exclude VAT. VAT is added at checkout, so a £45 dress costs £54.</span>
            </label>
          </fieldset>
          <p className="text-xs text-stone-500">Check with your accountant which applies to you. UK shoppers usually expect prices to include VAT.</p>
        </div>
      </Card>

      <Card title="Shipping">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="flat" className="block text-sm text-stone-700 mb-1">Shipping fee (£)</label>
              <input id="flat" inputMode="decimal" className="field" value={form.flatShipping} onChange={(e) => set('flatShipping', e.target.value)} />
            </div>
            <div>
              <label htmlFor="free" className="block text-sm text-stone-700 mb-1">Free shipping from (£)</label>
              <input id="free" inputMode="decimal" className="field" placeholder="Leave blank for never" value={form.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', e.target.value)} />
            </div>
          </div>
          <fieldset>
            <legend className="text-sm text-stone-700 mb-2">Countries you ship to</legend>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {SHIPPING_COUNTRIES.map((c) => (
                <label key={c.code} className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#2C1810]" checked={form.shippingCountries.includes(c.code)} onChange={() => toggleCountry(c.code)} />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Card>

      <Card title="Contact details">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm text-stone-700 mb-1">Email</label>
            <input id="email" type="email" className="field" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm text-stone-700 mb-1">Phone / WhatsApp</label>
            <input id="phone" className="field" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <button disabled={saving} className="px-5 py-2.5 rounded-md bg-espresso text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {message && <p role="status" className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{message.text}</p>}
      </div>
    </form>
  );
}
