'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { PublisherConfig } from '@/lib/config';
import { ProfileSwitcher, type ProfileSummary } from './ProfileSwitcher';

export function Header({
  config,
  brandName,
  brandLogo,
  signedIn,
  profiles = [],
  activeProfileIndex = 0,
}: {
  config: PublisherConfig;
  brandName: string;
  brandLogo?: string;
  signedIn?: boolean;
  profiles?: ProfileSummary[];
  activeProfileIndex?: number;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Transparent header over the hero video; solid once the viewer scrolls.
  // Only kick in on routes that have a full-bleed hero behind them.
  const hasHero = path === '/';
  useEffect(() => {
    if (!hasHero) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasHero]);

  const links = [
    { href: '/', label: 'Home', show: true },
    { href: '/browse', label: 'Browse', show: true },
    { href: '/epg', label: 'Live TV', show: config.epgEnabled },
    {
      href: '/my-list',
      label: 'My List',
      show: config.myListEnabled && !config.viewerAuthNone && (config.myListShowInNav || true),
    },
    { href: '/search', label: 'Search', show: true },
  ].filter((l) => l.show);

  const signInHref =
    config.viewerAuthMode === 'external' && config.viewerAuthExternalUrl
      ? config.viewerAuthExternalUrl
      : '/login';

  return (
    <>
      <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur'
          : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
      }`}
    >
      <nav className="flex items-center gap-2 sm:gap-6 px-4 sm:px-8 lg:px-12 h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-text-primary shrink-0">
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandLogo} alt={brandName} className="h-7 w-auto" />
          ) : (
            <span className="text-lg tracking-tight">
              <span className="text-primary">▶</span> {brandName}
            </span>
          )}
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  path === l.href
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          {!config.viewerAuthNone &&
            (signedIn ? (
              <>
                {profiles.length > 0 && (
                  <ProfileSwitcher
                    profiles={profiles}
                    activeIndex={activeProfileIndex}
                  />
                )}
                <form action="/api/auth/logout" method="POST" className="hidden sm:block">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-muted"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href={signInHref}
                className="inline-flex items-center px-3.5 py-1.5 rounded-md text-sm font-semibold bg-primary hover:bg-primary/90 text-white"
              >
                Sign in
              </Link>
            ))}

          <button
            type="button"
            className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <ul className="px-4 py-2 flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    path === l.href ? 'text-text-primary bg-muted' : 'text-text-secondary'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {!config.viewerAuthNone && signedIn && (
              <li>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary"
                  >
                    Sign out
                  </button>
                </form>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
      {!hasHero && <div aria-hidden className="h-14" />}
    </>
  );
}
