import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const isVercelDeployment = request.nextUrl.hostname.endsWith('.vercel.app');
  const isDemoMode = process.env.DEMO_MODE === 'true';

  if (isVercelDeployment || isDemoMode) {
    return NextResponse.next();
  }

  const { auth0 } = await import('./lib/auth0');
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
