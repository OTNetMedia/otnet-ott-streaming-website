import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.OTNET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OTNET_API_KEY is not configured' }, { status: 500 });
  }
  const body = await req.text();
  const upstream = await fetch('https://otnet.io/api/v1/telemetry/player-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body,
    cache: 'no-store',
  });
  console.log(`[otnet] POST /telemetry/player-error → ${upstream.status}`);
  return NextResponse.json({ ok: upstream.ok }, { status: upstream.status });
}
