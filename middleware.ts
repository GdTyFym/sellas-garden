import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';

const isGardenPublic = process.env.NEXT_PUBLIC_GARDEN_PUBLIC !== 'false';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const needsAuth =
    pathname.startsWith('/us') ||
    pathname.startsWith('/roadmap') ||
    (!isGardenPublic && pathname.startsWith('/garden'));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const { supabase, response } = createSupabaseMiddlewareClient(request);
  if (!supabase) {
    return response;
  }
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', `${pathname}${search}`);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/us/:path*', '/roadmap/:path*', '/garden/:path*']
};
