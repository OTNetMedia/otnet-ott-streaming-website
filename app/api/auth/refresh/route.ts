import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const apiKey = process.env.OTNET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OTNET_API_KEY is not configured' }, { status: 500 });
  }
  const refresh = cookies().get('otnet_viewer_refresh')?.value;
  if (!refresh) return NextResponse.json({ error: 'No refresh token' }, { status: 401 });

  const r = await fetch('https://otnet.io/api/v1/viewer/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify({ refreshToken: refresh }),
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  console.log(`[auth] POST /viewer/auth/refresh → ${r.status}`);
  if (!r.ok) return NextResponse.json(data, { status: r.status });

  cookies().set('otnet_viewer', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return NextResponse.json({ ok: true });
}
