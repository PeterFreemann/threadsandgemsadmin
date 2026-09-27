import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import SettingsForm from '@/components/SettingsForm';

export default async function SettingsPage() {
  await requirePermission('settings:edit');
  const { data, error } = await tryApi('/api/admin/settings');

  return (
    <>
      <PageHeader title="Store settings" description="Tax, shipping and contact details used across the store and checkout." />
      {error ? <ErrorNotice message={error} /> : <SettingsForm settings={data} />}
    </>
  );
}
