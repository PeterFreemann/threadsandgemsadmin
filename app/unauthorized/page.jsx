import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';

export default async function UnauthorizedPage({ searchParams }) {
  const { reason } = await searchParams;
  const isPermission = reason === 'permission';

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-lg overflow-hidden">
        <div className="ankara-band" />
        <div className="p-8">
          <h1 className="text-2xl font-medium text-espresso">
            {isPermission ? "Your role can't open this page" : 'This account has no admin access'}
          </h1>
          <p className="text-stone-600 mt-3">
            {isPermission
              ? 'Ask the store owner to change your role if you need it.'
              : 'Ask the store owner to add you to the team from the Team page, then sign in again.'}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {isPermission ? (
              <Link href="/" className="px-4 py-2 rounded-md bg-espresso text-white text-sm">
                Back to overview
              </Link>
            ) : (
              <SignOutButton redirectUrl="/sign-in">
                <button className="px-4 py-2 rounded-md bg-espresso text-white text-sm">
                  Sign in with another account
                </button>
              </SignOutButton>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
