import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { can, getRoleFromClaims } from './roles';

// Use in server components and pages.
export async function getAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect('/sign-in');

  const role = getRoleFromClaims(sessionClaims);
  if (!role) redirect('/unauthorized');

  return { userId, role };
}

export async function requirePermission(permission) {
  const admin = await getAdmin();
  if (!can(admin.role, permission)) redirect('/unauthorized?reason=permission');
  return admin;
}
