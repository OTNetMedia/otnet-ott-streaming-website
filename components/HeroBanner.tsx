'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  type Content,
  allGenreNames,
  contentDuration,
  displayDescription,
  displayTitle,
  displayYear,
  formatRuntime,
  heroBackdropUrl,
  isPaywalled,
  isSeries,
  primaryGenreName,
  teaserUrl,
  titleImageUrl,
} from '@/lib/types';

function metaValue(c: Content, regex: RegExp): string | undefined {
  return c.metadata?.find((m) => regex.test(m.key))?.value;
}

export function HeroBanner({
  items,
  showRating,
}: {
  items: Content[];
  showRating: boolean;
  ratingSystem?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const c = items[idx];
  const teaser = c ? teaserUrl(c) : undefined;
  const activeId = c?._id;

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 8000);
    return () => clearInterval(t);
  }, [items.length]);

  // Reset the video opacity each time the active hero item changes so the
  // backdrop image is shown until the new teaser actually starts playing.
  useEffect(() => {
    setVideoReady(false);
  }, [activeId]);

  // Load the teaser: shaka-player for DASH (.mpd), native <video> for
  // mp4/hls. shaka is dynamically imported so the bundle isn't shipped
  // when no teaser is set on the current hero item.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !teaser) return;

    let cancelled = false;
    let player: { destroy: () => Promise<void> } | null = null;
    const isDash = /\.mpd($|\?)/i.test(teaser);

    if (isDash) {
      import('shaka-player/dist/shaka-player.compiled')
        .then((mod) => {
          if (cancelled || !el) return;
          // shaka-player's CJS-style export exposes the namespace as the
          // module's `default` in some bundlers and as the module itself in
          // others; coerce through unknown to access Player regardless.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Shaka: any = (mod as unknown as { default?: unknown }).default ?? mod;
          const Player = Shaka?.Player;
          if (!Player) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p: any = new Player();
          player = p;
          p.attach(el).then(() => p.load(teaser)).catch(() => {});
        })
        .catch(() => {
          /* shaka load failed — leave the backdrop in place */
        });
    } else {
      el.src = teaser;
      el.load();
    }

    return () => {
      cancelled = true;
      if (player) player.destroy().catch(() => {});
      if (el && !isDash) {
        el.removeAttribute('src');
        el.load();
      }
    };
  }, [teaser]);

  if (!c) return null;
  const backdrop = heroBackdropUrl(c);
  const titleArt = titleImageUrl(c);
  const year = displayYear(c);
  const runtime = formatRuntime(contentDuration(c));
  const rating = showRating ? c.ageRating : undefined;
  const genre = primaryGenreName(c) ?? allGenreNames(c, 1)[0];
  const live = c.broadcastStatus === 'live';
  const locked = isPaywalled(c);
  const award = metaValue(c, /award|emmy|oscar|nominat/i);
  const seriesType = isSeries(c) ? 'SERIES' : 'FILM';

  return (
    <section className="relative">
      <div className="relative w-full aspect-[21/9] sm:aspect-[16/7] min-h-[420px] overflow-hidden bg-card">
        {backdrop ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c._id}
            src={backdrop}
            alt=""
            className="absolute inset-0 h-full w-full object-cover animate-fade-in"
          />
        ) : (
          <div
            className="absolute inset-0 animate-fade-in"
            style={{
              background:
                'radial-gradient(ellipse at 75% 45%, hsl(0,80%,22%) 0%, #0A0A0A 65%)',
            }}
          />
        )}

        {/* Teaser video — shaka-player loads DASH manifests in a useEffect;
            for mp4/hls the src is assigned directly. Fades in over the
            backdrop once playback actually starts. */}
        {teaser && (
          <video
            key={`v-${c._id}`}
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onPlaying={() => setVideoReady(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
          />
        )}

        {/* Gradients — fade right→left so left side stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        {/* Bottom fade — transitions the video into the page background so the
            row that follows feels like it grows out of the hero. */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />

        <div className="relative h-full flex items-center">
          <div className="max-w-xl sm:max-w-2xl px-4 sm:px-8 lg:px-12 pb-6 space-y-3 sm:space-y-4">
            {live && (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Live now
              </span>
            )}

            {award && (
              <div className="inline-block border border-amber-200/60 px-3 py-1 text-amber-100">
                <span className="text-[10px] sm:text-xs font-extrabold tracking-[0.3em] uppercase">
                  {award}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-white/90">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-sm bg-primary text-white font-black text-[11px]">
                N
              </span>
              <span>{seriesType}</span>
            </div>

            {titleArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={titleArt}
                alt={displayTitle(c)}
                className="max-h-24 sm:max-h-32 w-auto drop-shadow-2xl"
              />
            ) : (
              <h1 className="solid-title text-4xl sm:text-6xl lg:text-7xl">
                {displayTitle(c)}
              </h1>
            )}

            {c.venue && (
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                {c.venue}
              </p>
            )}

            <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-white/85 font-medium">
              {genre && <li>{genre}</li>}
              {genre && (year || rating || runtime) && <li aria-hidden>·</li>}
              {year && <li>{year}</li>}
              {year && (rating || runtime) && <li aria-hidden>·</li>}
              {rating && <li>{rating}</li>}
              {rating && runtime && <li aria-hidden>·</li>}
              {runtime && <li>{runtime}</li>}
            </ul>

            {displayDescription(c) && (
              <p className="text-sm sm:text-base leading-snug text-white/90 line-clamp-3 max-w-md">
                {displayDescription(c)}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Link
                href={locked ? `/content/${c._id}` : `/watch/${c._id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-black hover:bg-white/90"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {locked ? 'Details' : 'Play'}
              </Link>
              <Link
                href={`/content/${c._id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/25 border border-white/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </svg>
                More Info
              </Link>
              {locked && c.paywall?.mode && (
                <span className="rounded-full bg-primary/20 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary border border-primary/30">
                  {c.paywall.mode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mute toggle — only shown when a teaser is actually playing */}
        {teaser && (
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="absolute bottom-4 right-6 sm:right-12 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
            style={{ transform: items.length > 1 ? 'translateY(-28px)' : undefined }}
          >
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M23 9l-6 6M17 9l6 6" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 010 7.07" />
                <path d="M19.07 4.93a10 10 0 010 14.14" />
              </svg>
            )}
          </button>
        )}

        {/* Slide indicators */}
        {items.length > 1 && (
          <div className="absolute bottom-4 right-6 sm:right-12 flex gap-1.5 z-10">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1 rounded-full transition-all ${
                  i === idx ? 'w-8 bg-white' : 'w-1 bg-white/40'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
