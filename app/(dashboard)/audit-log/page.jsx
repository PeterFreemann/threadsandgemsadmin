import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import { formatDateTime } from '@/lib/format';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { Table, Td } from '@/components/Table';

export default async function AuditLogPage({ searchParams }) {
  await requirePermission('audit:view');
  const sp = await searchParams;
  const { data, error } = await tryApi('/api/admin/audit-log', { searchParams: { page: sp.page || '1' } });

  return (
    <>
      <PageHeader title="Activity log" description="Every change made in the admin, newest first." />
      {error ? (
        <ErrorNotice message={error} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Nothing recorded yet" />
      ) : (
        <>
          <Table head={['When', 'Who', 'What happened']}>
            {data.items.map((entry) => (
              <tr key={entry._id}>
                <Td className="whitespace-nowrap text-stone-600">{formatDateTime(entry.createdAt)}</Td>
                <Td className="whitespace-nowrap">{entry.adminEmail}</Td>
                <Td>{entry.summary}</Td>
              </tr>
            ))}
          </Table>
          <Pagination page={data.page} pages={data.pages} total={data.total} basePath="/audit-log" />
        </>
      )}
    </>
  );
}
