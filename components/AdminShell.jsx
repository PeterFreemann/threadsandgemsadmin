'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton, UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard, ShoppingBag, Shirt, Tags, Users, Mail, AtSign,
  Settings, ShieldCheck, ScrollText, Menu, X, ExternalLink, LogOut,
} from 'lucide-react';
import { can, ROLE_LABELS } from '@/lib/roles';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, permission: 'dashboard:view' },
  { href: '/orders', label: 'Orders', icon: ShoppingBag, permission: 'orders:view' },
  { href: '/products', label: 'Products', icon: Shirt, permission: 'products:view' },
  { href: '/categories', label: 'Categories', icon: Tags, permission: 'products:view' },
  { href: '/customers', label: 'Customers', icon: Users, permission: 'customers:view' },
  { href: '/messages', label: 'Messages', icon: Mail, permission: 'messages:view' },
  { href: '/subscribers', label: 'Subscribers', icon: AtSign, permission: 'subscribers:view' },
  { divider: true, permission: 'settings:edit' },
  { href: '/settings', label: 'Store settings', icon: Settings, permission: 'settings:edit' },
  { href: '/team', label: 'Team', icon: ShieldCheck, permission: 'team:manage' },
  { href: '/audit-log', label: 'Activity log', icon: ScrollText, permission: 'audit:view' },
];

function isActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ role, name, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((item) => can(role, item.permission));
  const storeUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL;

  const nav = (
    <nav className="flex flex-col h-full">
      <div className="ankara-band" />
      <div className="px-5 pt-6 pb-8">
        <p className="text-gold text-lg leading-none">Threads &amp; Gems</p>
        <p className="text-stone-400 text-sm mt-1">Store admin</p>
      </div>
      <ul className="flex-1 px-3 space-y-0.5">
        {items.map((item, i) =>
          item.divider ? (
            <li key={`d${i}`} className="my-3 border-t border-white/10" aria-hidden />
          ) : (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive(pathname, item.href)
                    ? 'bg-white/10 text-white shadow-[inset_3px_0_0_var(--color-gold)]'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          )
        )}
      </ul>
      {storeUrl && (
        <a
          href={storeUrl}
          target="_blank"
          rel="noreferrer"
          className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 text-sm text-stone-400 hover:text-white"
        >
          <ExternalLink className="w-4 h-4" aria-hidden />
          View store
        </a>
      )}
      <SignOutButton redirectUrl="/sign-in">
        <button
          type="button"
          className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 text-sm text-stone-400 hover:text-white text-left"
        >
          <LogOut className="w-4 h-4" aria-hidden />
          Sign out
        </button>
      </SignOutButton>
      <div className="border-t border-white/10 px-5 py-4 flex items-center gap-3">
        <UserButton />
        <div className="min-w-0">
          <p className="text-sm text-white truncate">{name}</p>
          <p className="text-xs text-gold">{ROLE_LABELS[role]}</p>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:block w-60 shrink-0 bg-espresso sticky top-0 h-screen overflow-y-auto">
        {nav}
      </aside>

      <header className="md:hidden sticky top-0 z-30 bg-espresso text-white flex items-center justify-between px-4 h-14">
        <span className="text-gold">Threads &amp; Gems</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-espresso h-full overflow-y-auto relative">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute top-5 right-3 p-2 text-stone-300"
            >
              <X className="w-5 h-5" />
            </button>
            {nav}
          </div>
          <button className="flex-1 bg-black/40" aria-label="Close menu" onClick={() => setOpen(false)} />
        </div>
      )}

      <main className="flex-1 min-w-0 px-4 py-6 md:px-10 md:py-10 max-w-7xl">{children}</main>
    </div>
  );
}
