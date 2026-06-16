import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BASE = 'https://otnet.io/api/v1';

function headers(): Record<string, string> | NextResponse {
  const apiKey = process.env.OTNET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OTNET_API_KEY not configured' }, { status: 500 });
  }
  const token = cookies().get('otnet_viewer')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': apiKey,
    Authorization: `Bearer ${token}`,
  };
}

async function proxy(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: string) {
  const h = headers();
  if (h instanceof NextResponse) return h;
  const r = await fetch(`${BASE}/viewer/profiles`, {
    method,
    headers: h,
    body,
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  console.log(`[profiles] ${method} /viewer/profiles → ${r.status}`);
  return NextResponse.json(data, { status: r.status });
}

export async function GET() {
  try {
    return await proxy('GET');
  } catch (e) {
    console.error('[profiles] GET threw', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    return await proxy('POST', await req.text());
  } catch (e) {
    console.error('[profiles] POST threw', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    return await proxy('PATCH', await req.text());
  } catch (e) {
    console.error('[profiles] PATCH threw', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // Allow either ?index= or body { index }; forward in body.
    const url = new URL(req.url);
    const fromQuery = url.searchParams.get('index');
    const body = fromQuery
      ? JSON.stringify({ index: Number(fromQuery) })
      : await req.text();
    return await proxy('DELETE', body);
  } catch (e) {
    console.error('[profiles] DELETE threw', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
