import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import { formatDate } from '@/lib/format';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import EmptyState from '@/components/EmptyState';
import ExportCsvButton from '@/components/ExportCsvButton';
import { Table, Td } from '@/components/Table';

const SOURCES = { home: 'Homepage', shop: 'Shop page', contact: 'Contact page', footer: 'Footer' };

export default async function SubscribersPage() {
  await requirePermission('subscribers:view');
  const { data, error } = await tryApi('/api/admin/subscribers', { searchParams: { limit: 5000 } });

  return (
    <>
      <PageHeader
        title="Newsletter subscribers"
        description={data ? `${data.total ?? data.items.length} people signed up from the store.` : undefined}
        actions={data?.items?.length ? <ExportCsvButton rows={data.items} /> : null}
      />
      {error ? (
        <ErrorNotice message={error} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No subscribers yet">Sign-ups from the newsletter boxes on the store will appear here.</EmptyState>
      ) : (
        <Table head={['Email', 'Signed up from', 'Date']}>
          {data.items.map((s) => (
            <tr key={s._id}>
              <Td className="text-espresso">{s.email}</Td>
              <Td className="text-stone-600">{SOURCES[s.source] || s.source}</Td>
              <Td className="text-stone-600 whitespace-nowrap">{formatDate(s.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
