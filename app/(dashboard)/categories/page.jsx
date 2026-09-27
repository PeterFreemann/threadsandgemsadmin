import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import { can } from '@/lib/roles';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import CategoryManager from '@/components/CategoryManager';

export default async function CategoriesPage() {
  const { role } = await requirePermission('products:view');
  const { data, error } = await tryApi('/api/admin/categories');

  return (
    <>
      <PageHeader title="Categories" description="The filter tabs shoppers see on the shop page." />
      {error ? <ErrorNotice message={error} /> : <CategoryManager categories={data.items} canEdit={can(role, 'categories:edit')} />}
    </>
  );
}
