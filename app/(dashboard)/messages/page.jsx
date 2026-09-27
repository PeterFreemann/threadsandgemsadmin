import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import { formatDateTime } from '@/lib/format';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import MessageActions from '@/components/MessageActions';

const TABS = [
  { value: 'new', label: 'New' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];

export default async function MessagesPage({ searchParams }) {
  await requirePermission('messages:view');
  const sp = await searchParams;
  const status = sp.status || 'new';
  const { data, error } = await tryApi('/api/admin/messages', { searchParams: { status, page: sp.page || '1' } });

  return (
    <>
      <PageHeader title="Messages" description="Sent from the contact page on the store." />
      <nav className="flex gap-1 mb-6 border-b border-stone-200" aria-label="Message status">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/messages?status=${t.value}`}
            aria-current={status === t.value ? 'page' : undefined}
            className={`px-4 py-2 text-sm -mb-px border-b-2 ${
              status === t.value ? 'border-gold text-espresso' : 'border-transparent text-stone-500 hover:text-espresso'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {error ? (
        <ErrorNotice message={error} />
      ) : data.items.length === 0 ? (
        <EmptyState title={status === 'new' ? 'No new messages' : `No ${status} messages`} />
      ) : (
        <>
          <ul className="space-y-4 max-w-3xl">
            {data.items.map((m) => (
              <li key={m._id} className="bg-white border border-stone-200 rounded-lg p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-espresso">{m.subject || 'No subject'}</p>
                    <p className="text-sm text-stone-500">
                      {m.name}, <a className="text-gold-deep hover:underline" href={`mailto:${m.email}`}>{m.email}</a>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    <span className="text-xs text-stone-500">{formatDateTime(m.createdAt)}</span>
                  </div>
                </div>
                <p className="text-stone-700 mt-3 whitespace-pre-line leading-relaxed">{m.message}</p>
                <MessageActions message={m} />
              </li>
            ))}
          </ul>
          <Pagination page={data.page} pages={data.pages} total={data.total} basePath="/messages" searchParams={{ status }} />
        </>
      )}
    </>
  );
}
