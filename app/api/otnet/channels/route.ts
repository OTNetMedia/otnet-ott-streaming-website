import { NextResponse } from 'next/server';

// Channel-list endpoint the player optionally calls for channel-zap.
// Surfaces the EPG channel array in a flat shape the player's zap UI expects.
export async function GET() {
  const apiKey = process.env.OTNET_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ channels: [] }, { status: 200 });
  }
  const upstream = await fetch('https://otnet.io/api/v1/catalog/epg', {
    headers: { 'X-Api-Key': apiKey },
    next: { revalidate: 60 },
  });
  if (!upstream.ok) {
    return NextResponse.json({ channels: [] }, { status: 200 });
  }
  const data = (await upstream.json().catch(() => ({}))) as {
    channels?: { channel?: { _id?: string; name?: string; logo?: string } }[];
  };
  const channels = (data.channels ?? [])
    .map((row) => row.channel)
    .filter((c): c is { _id: string; name?: string; logo?: string } => !!c?._id);
  return NextResponse.json({ channels });
}
