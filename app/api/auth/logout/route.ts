import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  cookies().delete('otnet_viewer');
  cookies().delete('otnet_viewer_refresh');
  const accept = req.headers.get('accept') ?? '';
  if (!accept.includes('application/json')) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.json({ ok: true });
}
