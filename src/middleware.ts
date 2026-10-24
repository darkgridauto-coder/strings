import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/', '/signup', '/login', '/verify', '/account', '/legal', '/guidelines'];

function isPublic(p: string) {
  if (p === '/') return true;
  return PUBLIC.some((x) => p === x || p.startsWith(x + '/'));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const has = !!req.cookies.get('strings_session')?.value;
  if (!has) {
    const u = req.nextUrl.clone();
    u.pathname = '/login';
    u.searchParams.set('next', pathname);
    return NextResponse.redirect(u);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
};
