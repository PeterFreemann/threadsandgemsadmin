// Next.js 16 route protection (this file was called middleware.js before Next 16).
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/unauthorized']);
const ADMIN_ROLES = ['super_admin', 'admin', 'staff'];

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  await auth.protect();

  const { sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
