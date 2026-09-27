import { requirePermission } from '@/lib/auth';
import { tryApi } from '@/lib/api-server';
import PageHeader from '@/components/PageHeader';
import ErrorNotice from '@/components/ErrorNotice';
import ProductForm from '@/components/ProductForm';

export default async function EditProductPage({ params }) {
  await requirePermission('products:edit');
  const { id } = await params;
  const [product, categories] = await Promise.all([
    tryApi(`/api/admin/products/${id}`),
    tryApi('/api/admin/categories'),
  ]);
  const error = product.error || categories.error;

  return (
    <>
      <PageHeader title={product.data?.name || 'Edit product'} />
      {error ? <ErrorNotice message={error} /> : <ProductForm product={product.data} categories={categories.data.items} />}
    </>
  );
}
