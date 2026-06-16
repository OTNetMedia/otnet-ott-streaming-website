import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const apiKey = process.env.OTNET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OTNET_API_KEY is not configured' }, { status: 500 });
  }
  const viewerToken = cookies().get('otnet_viewer')?.value;
  if (!viewerToken) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const body = await req.text();
  const r = await fetch('https://otnet.io/api/v1/pairing/activate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      Authorization: `Bearer ${viewerToken}`,
    },
    body,
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  console.log(`[auth] POST /pairing/activate → ${r.status}`);
  return NextResponse.json(data, { status: r.status });
}
