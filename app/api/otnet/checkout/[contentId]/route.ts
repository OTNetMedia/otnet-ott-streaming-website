import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request, { params }: { params: { contentId: string } }) {
  const viewerToken = cookies().get('otnet_viewer')?.value;
  if (!viewerToken) {
    return NextResponse.json({ error: 'signin_required' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({} as { successUrl?: string; cancelUrl?: string; planName?: string }));
  const origin = new URL(req.url).origin;

  const upstream = await fetch(
    `https://otnet.io/api/v1/viewer/checkout/${encodeURIComponent(params.contentId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        successUrl: body.successUrl || `${origin}/watch/${params.contentId}?purchase=success`,
        cancelUrl: body.cancelUrl || `${origin}/content/${params.contentId}`,
        ...(body.planName ? { planName: body.planName } : {}),
      }),
      cache: 'no-store',
    },
  );
  const data = await upstream.json().catch(() => ({}));
  console.log(`[otnet] POST /viewer/checkout/${params.contentId} → ${upstream.status}`);
  return NextResponse.json(data, { status: upstream.status });
}
