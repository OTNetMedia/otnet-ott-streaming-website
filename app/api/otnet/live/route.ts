import { NextResponse } from 'next/server';

// Live-channel mint proxy. The player POSTs { channelId, protocol } here,
// we forward to OTNet's playback handshake with the publisher's X-Api-Key
// attached server-side. Response (manifest URL + DRM session + ad policy)
// is returned verbatim to the player.
export async function POST(req: Request) {
  const apiKey = process.env.OTNET_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OTNET_API_KEY is not configured on the server' },
      { status: 500 },
    );
  }

  const payload = await req
    .json()
    .catch(() => ({} as { channelId?: string; protocol?: string }));
  const { channelId } = payload;
  if (!channelId) {
    return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
  }
  const protocol = payload.protocol === 'hls' ? 'hls' : 'dash';

  const upstream = await fetch(
    `https://otnet.io/api/v1/playback/live/${encodeURIComponent(channelId)}/mint`,
    {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocol }),
      cache: 'no-store',
    },
  );
  const body = await upstream.text();
  console.log(
    `[otnet] POST /playback/live/${channelId}/mint → ${upstream.status}`,
  );
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
