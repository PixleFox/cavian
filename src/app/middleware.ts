import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminId = request.cookies.get('admin-auth')?.value;
  const pathname = request.nextUrl.pathname;

  // Define route types
  const isLoginPage = pathname === '/admin/login';
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminCreationRoute = pathname === '/api/admin/create';

  // ✅ 1. Redirect logged-in admins away from login page
  if (adminId && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/panel', request.url));
  }

  // ✅ 2. Restrict access to admin routes
  if (isAdminRoute && !adminId) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // ✅ 3. Prevent unnecessary database queries
  if (!adminId) {
    return NextResponse.next();
  }

  // ✅ 4. Protect admin creation (Super Admin Only)
  if (isAdminCreationRoute) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  // ✅ 5. Allow other routes to proceed
  return NextResponse.next();
}

// ✅ Protect only necessary routes
export const config = {
  matcher: ['/admin/:path*', '/api/admin/create']
};
