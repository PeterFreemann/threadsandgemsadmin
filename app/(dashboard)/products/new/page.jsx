import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import ProductForm from '@/components/ProductForm';

export default async function NewProductPage() {
  await requirePermission('products:edit');
  const { data, error } = await tryApi('/api/admin/categories');

  return (
    <>
      <PageHeader title="Add product" description="New products start as drafts until you set them live." />
      {error ? <ErrorNotice message={error} /> : <ProductForm categories={data.items} />}
    </>
  );
}
