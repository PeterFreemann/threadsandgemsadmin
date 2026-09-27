import { currentUser } from '@clerk/nextjs/server';
import AdminShell from '@/components/AdminShell';
import { getAdmin } from '@/lib/auth';

export default async function DashboardLayout({ children }) {
  const { role } = await getAdmin();
  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.primaryEmailAddress?.emailAddress ||
    'Admin';

  return (
    <AdminShell role={role} name={name}>
      {children}
    </AdminShell>
  );
}
