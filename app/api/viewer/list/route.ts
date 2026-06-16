import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getActiveProfileIndex } from '@/lib/profile';

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

export async function POST(req: Request) {
  try {
    const h = headers();
    if (h instanceof NextResponse) return h;
    const { contentId } = await req.json().catch(() => ({}));
    if (!contentId) {
      return NextResponse.json({ error: 'contentId required' }, { status: 400 });
    }
    const profileIndex = getActiveProfileIndex();
    const r = await fetch(`${BASE}/viewer/list`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ contentId, profileIndex }),
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    console.log(`[my-list] POST /viewer/list ${contentId} → ${r.status}`);
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error('[my-list] POST threw', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const h = headers();
    if (h instanceof NextResponse) return h;
    const url = new URL(req.url);
    const contentId = url.searchParams.get('contentId');
    if (!contentId) {
      return NextResponse.json({ error: 'contentId required' }, { status: 400 });
    }
    const profileIndex = getActiveProfileIndex();
    // The docs list a flat DELETE /viewer/list — identifiers go in the body.
    const r = await fetch(`${BASE}/viewer/list`, {
      method: 'DELETE',
      headers: h,
      body: JSON.stringify({ contentId, profileIndex }),
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    console.log(`[my-list] DELETE /viewer/list ${contentId} → ${r.status}`);
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error('[my-list] DELETE threw', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const h = headers();
    if (h instanceof NextResponse) return h;
    const profileIndex = getActiveProfileIndex();
    const url = profileIndex > 0
      ? `${BASE}/viewer/list?profileIndex=${profileIndex}`
      : `${BASE}/viewer/list`;
    // GET 500s when X-Api-Key + viewer JWT are both present; viewer JWT
    // alone matches the apikey-or-viewer spec and identity comes from
    // the JWT, so we drop the publisher key on this call.
    const viewerOnly: Record<string, string> = {
      'Content-Type': h['Content-Type'],
      Authorization: h.Authorization,
    };
    const r = await fetch(url, { headers: viewerOnly, cache: 'no-store' });
    const text = await r.text();
    if (!r.ok) {
      console.log(`[my-list] GET ${url} → ${r.status} body: ${text.slice(0, 500)}`);
    } else {
      console.log(`[my-list] GET ${url} → ${r.status}`);
    }
    let data: unknown = {};
    try {
      data = JSON.parse(text);
    } catch {
      /* not json */
    }
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error('[my-list] GET threw', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
