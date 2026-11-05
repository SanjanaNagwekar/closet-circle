import { NextRequest, NextResponse } from 'next/server';

import { auth0 } from '@/lib/auth0';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function getApiBaseUrl(): URL {
  const apiBaseUrl = new URL(process.env.API_BASE_URL || 'http://127.0.0.1:8800');

  if (apiBaseUrl.protocol !== 'http:' && apiBaseUrl.protocol !== 'https:') {
    throw new Error('API_BASE_URL must use http or https');
  }

  return apiBaseUrl;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const apiUrl = new URL(`/api/${path.map(encodeURIComponent).join('/')}`, getApiBaseUrl());
  apiUrl.search = request.nextUrl.search;

  const requestHeaders = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');

  if (contentType) requestHeaders.set('content-type', contentType);
  if (accept) requestHeaders.set('accept', accept);

  try {
    const { token } = await auth0.getAccessToken();
    requestHeaders.set('authorization', `Bearer ${token}`);
  } catch {
    // Public API routes do not require an Auth0 session. Protected routes
    // return 401 from the Express API when no access token is available.
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  try {
    const apiResponse = await fetch(apiUrl, {
      method: request.method,
      headers: requestHeaders,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });

    const responseHeaders = new Headers();
    const responseContentType = apiResponse.headers.get('content-type');
    const location = apiResponse.headers.get('location');
    const authenticate = apiResponse.headers.get('www-authenticate');

    if (responseContentType) responseHeaders.set('content-type', responseContentType);
    if (location) responseHeaders.set('location', location);
    if (authenticate) responseHeaders.set('www-authenticate', authenticate);

    return new NextResponse(apiResponse.body, {
      status: apiResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Backend API request failed', error);
    return NextResponse.json({ error: 'Backend service is unavailable' }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
