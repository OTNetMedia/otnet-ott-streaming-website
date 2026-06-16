import { cookies } from 'next/headers';

const COOKIE = 'otnet_profile_idx';
const MAX_AGE = 60 * 60 * 24 * 365;

export interface ViewerProfile {
  index: number;
  name: string;
  avatar?: string;
  pin?: boolean;
  kids?: boolean;
}

export function getActiveProfileIndex(): number {
  try {
    const v = cookies().get(COOKIE)?.value;
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setActiveProfileIndex(idx: number): void {
  cookies().set(COOKIE, String(idx), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}
