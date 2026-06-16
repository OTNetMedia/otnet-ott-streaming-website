import { NextResponse } from 'next/server';
import { setActiveProfileIndex } from '@/lib/profile';

export async function POST(req: Request) {
  const { profileIndex } = await req.json().catch(() => ({}));
  const idx = Number(profileIndex);
  if (!Number.isFinite(idx) || idx < 0) {
    return NextResponse.json({ error: 'invalid profileIndex' }, { status: 400 });
  }
  setActiveProfileIndex(idx);
  return NextResponse.json({ profileIndex: idx });
}
