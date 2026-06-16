import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const apiKey = process.env.OTNET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OTNET_API_KEY is not configured' }, { status: 500 });
  }
  const inboundBody = await req.json().catch(() => ({}));
  const viewerToken = cookies().get('otnet_viewer')?.value;

  const r = await fetch('https://otnet.io/api/v1/viewer/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify({ ...inboundBody, viewerToken }),
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  console.log(`[otnet] POST /viewer/session → ${r.status}`);
  return NextResponse.json(data, { status: r.status });
}
