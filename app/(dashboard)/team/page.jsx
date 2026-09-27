import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import TeamManager from '@/components/TeamManager';

export default async function TeamPage() {
  const { userId } = await requirePermission('team:manage');
  const { data, error } = await tryApi('/api/admin/team');

  return (
    <>
      <PageHeader title="Team" description="Who can sign in to this admin, and what they can do." />
      {error ? <ErrorNotice message={error} /> : <TeamManager members={data.items} currentUserId={userId} />}
    </>
  );
}
