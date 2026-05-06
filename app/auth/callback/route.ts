import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    const errorMessage = error === 'access_denied' || errorDescription?.includes('cancel')
      ? 'Inicio de sesión cancelado'
      : error;
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  try {
    const provider = requestUrl.searchParams.get('state') || 'google';

    const response = await fetch(`${apiBaseUrl}/api/auth/oauth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'OAuth failed' }));
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errData.error || 'oauth_failed')}`, requestUrl.origin));
    }

    const data = await response.json();

    const redirectUrl = new URL('/auth/callback-handler', requestUrl.origin);
    redirectUrl.searchParams.set('access_token', data.access_token);
    redirectUrl.searchParams.set('refresh_token', data.refresh_token);
    redirectUrl.searchParams.set('requires_approval', data.requires_approval ? 'true' : 'false');
    redirectUrl.searchParams.set('access_rejected', data.access_rejected ? 'true' : 'false');
    redirectUrl.searchParams.set('has_tenant', data.has_tenant ? 'true' : 'false');

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('[Auth Callback] Error:', err);
    return NextResponse.redirect(new URL('/login?error=unexpected_error', requestUrl.origin));
  }
}