import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const apiKey = process.env.OTNET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OTNET_API_KEY is not configured' }, { status: 500 });
  }
  const body = await req.text();
  const r = await fetch('https://otnet.io/api/v1/viewer/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body,
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  console.log(`[auth] POST /viewer/auth/login → ${r.status}`);
  if (!r.ok) return NextResponse.json(data, { status: r.status });

  cookies().set('otnet_viewer', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  if (data.refreshToken) {
    cookies().set('otnet_viewer_refresh', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return NextResponse.json({ viewer: data.viewer });
}
