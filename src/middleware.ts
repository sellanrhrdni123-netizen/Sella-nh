import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getSupabaseEnvConfig } from '@/lib/supabase/config';

/**
 * Next.js Edge Middleware for TataDana
 * Enforces route protection on /admin/* and /dashboard/*, handles redirects & auth checks.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const config = getSupabaseEnvConfig();

  // If Supabase live keys are present, delegate session validation to Supabase SSR
  if (config.isConfigured) {
    return await updateSession(request);
  }

  // In local development / mock mode, check auth cookie or session header
  const sessionCookie = request.cookies.get('tatadana_session')?.value;
  const roleCookie = request.cookies.get('tatadana_auth_role')?.value;
  const userCookie = request.cookies.get('tatadana_auth_user')?.value;
  const adminToken = request.cookies.get('tatadana_admin_session')?.value;

  const isAuthenticated = Boolean(sessionCookie || userCookie || roleCookie);
  const isAdmin = roleCookie === 'admin' || roleCookie === 'superadmin' || userCookie === 'usr_admin_tatadana_01' || adminToken === 'active' || (sessionCookie && sessionCookie.includes('admin'));

  // 1. Dashboard Route Protection (/dashboard/*)
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
  }

  // 2. Admin Route Protection (/admin, /admin/*, /superadmin)
  if (pathname === '/admin' || pathname.startsWith('/admin') || pathname === '/superadmin') {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      url.searchParams.set('error', 'unauthorized_admin');
      return NextResponse.redirect(url);
    }

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      url.searchParams.set('error', 'unauthorized_admin');
      return NextResponse.redirect(url);
    }
  }

  // 3. Delegate remaining session refresh & user checks to updateSession
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
