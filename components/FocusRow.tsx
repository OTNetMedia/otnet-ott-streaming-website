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
  isPaywalled,
  isSeries,
  landscapeUrl,
  metadataValue,
  posterUrl,
  primaryGenreName,
  teaserUrl,
  titleImageUrl,
} from '@/lib/types';
import { ContentRow } from './ContentRow';
import { RatingBadge } from './RatingBadge';

function awardOf(c: Content): string | undefined {
  return c.metadata?.find((m) => /award|emmy|oscar|nominat|winner/i.test(m.key))?.value;
}

// Inline teaser player for the focused tile. Mirrors the hero's shaka/<video>
// loader so DASH manifests work without bundling shaka into the main chunk.
function FocusTeaser({
  contentId,
  src,
  muted,
}: {
  contentId: string;
  src: string;
  muted: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
  }, [contentId]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = muted;
  }, [muted]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let player: { destroy: () => Promise<void> } | null = null;
    const isDash = /\.mpd($|\?)/i.test(src);

    if (isDash) {
      import('shaka-player/dist/shaka-player.compiled')
        .then((mod) => {
          if (cancelled || !el) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Shaka: any = (mod as unknown as { default?: unknown }).default ?? mod;
          const Player = Shaka?.Player;
          if (!Player) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p: any = new Player();
          player = p;
          p.attach(el).then(() => p.load(src)).catch(() => {});
        })
        .catch(() => {});
    } else {
      el.src = src;
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
  }, [src]);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      onPlaying={() => setReady(true)}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden
    />
  );
}

function MuteToggle({
  muted,
  onClick,
  className = '',
}: {
  muted: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={muted ? 'Unmute' : 'Mute'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white backdrop-blur transition hover:bg-black/60 ${className}`}
    >
      {muted ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M23 9l-6 6M17 9l6 6" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 010 7.07" />
          <path d="M19.07 4.93a10 10 0 010 14.14" />
        </svg>
      )}
    </button>
  );
}

// Flex-grow units, derived from aspect ratios. Focus tile is 16:9, portrait
// tiles are 2:3, all at equal height. The width ratio is (16/9) : (2/3) = 8 : 3,
// so the focused tile gets 16 (8×2) and portrait tiles get 6 (3×2). The
// container distributes leftover width using these ratios, and we transition
// flex-grow on hover so the focus expands smoothly.
const FOCUS_GROW = 16;
const REST_GROW = 6;

export function FocusRow({
  title,
  items,
  showRating,
  ratingSystem,
  viewAllHref,
}: {
  title: string;
  items: Content[];
  showRating: boolean;
  ratingSystem?: string;
  viewAllHref?: string;
}) {
  const visible = items.slice(0, 5);
  const [focusIdx, setFocusIdx] = useState(0);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setFocusIdx(0);
  }, [visible.map((c) => c._id).join(',')]);

  if (visible.length === 0) return null;
  const safeIdx = Math.min(focusIdx, visible.length - 1);
  const focused = visible[safeIdx];

  // Lock the row height by deriving an aspect ratio for the whole strip from
  // the focused tile's intended 16:9 share. Flex-grow is static per render
  // (16 for focus, 6 each for the rest), so focus_width = total * share. We
  // want focus_height = focus_width * 9/16, and the row height matches the
  // focus height — giving row_aspect = total/focus_height = 16/(share*9).
  // Setting this on the container means the row height doesn't shift when
  // the focused index changes, so the UI doesn't jump during hover.
  const totalGrow = FOCUS_GROW + REST_GROW * (visible.length - 1);
  const focusShare = FOCUS_GROW / totalGrow;
  const rowAspect = 16 / (focusShare * 9);

  const year = displayYear(focused);
  const runtime = formatRuntime(contentDuration(focused));
  const rating = showRating ? focused.ageRating : undefined;
  const seriesLabel = isSeries(focused)
    ? focused.childCount
      ? `${focused.childCount} Seasons`
      : 'Series'
    : undefined;
  const genre = primaryGenreName(focused) ?? allGenreNames(focused, 1)[0];
  const newSeason =
    metadataValue(focused, 'New Season') ?? metadataValue(focused, 'Status');

  return (
    <>
      {/* Mobile: fall back to a standard horizontal poster scroller. The focus
          tile + previews layout depends on hover, which doesn't exist on touch
          devices, and the tiny preview tiles render unreadably at phone widths. */}
      <div className="sm:hidden">
        <ContentRow
          title={title}
          items={items}
          tile="portrait"
          showRating={showRating}
          ratingSystem={ratingSystem}
          viewAllHref={viewAllHref}
        />
      </div>

    <section className="space-y-3 py-6 hidden sm:block">
      <div className="px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            View all
            <span aria-hidden className="ml-1">›</span>
          </Link>
        )}
      </div>

      <div className="px-4 sm:px-8 lg:px-12">
        <div
          className="relative flex gap-3 items-stretch"
          style={{ aspectRatio: rowAspect.toString() }}
        >
          {visible.map((c, i) => {
            const isFocus = i === safeIdx;
            // Landscape art when available — it scales gracefully at both
            // wide (focused) and narrow (portrait) widths via object-cover.
            // Fall back to portrait if no landscape exists.
            const art = landscapeUrl(c) ?? posterUrl(c);
            const titleArt = titleImageUrl(c);
            const award = awardOf(c);
            const tileLive = c.broadcastStatus === 'live';
            const tileNewSeason =
              metadataValue(c, 'New Season') ?? metadataValue(c, 'Status');

            return (
              <Link
                key={c._id}
                href={`/content/${c._id}`}
                onMouseEnter={() => setFocusIdx(i)}
                onFocus={() => setFocusIdx(i)}
                aria-label={displayTitle(c)}
                style={{
                  flex: `${isFocus ? FOCUS_GROW : REST_GROW} 0 0`,
                  transition: 'flex-grow 350ms cubic-bezier(.2,.7,.2,1)',
                }}
                className={`group relative overflow-hidden rounded-lg bg-card min-w-0 ${
                  isFocus ? 'border-2 border-white/90' : 'border border-border'
                }`}
              >
                {art ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={art}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />
                )}

                {/* Teaser video — only on the focused tile, fades in over the art */}
                {isFocus && teaserUrl(c) && (
                  <FocusTeaser contentId={c._id} src={teaserUrl(c)!} muted={muted} />
                )}

                {/* Static dimming for non-focused tiles */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    isFocus ? 'opacity-0' : 'opacity-30'
                  } bg-black`}
                />

                {/* Bottom gradient — stronger on focus to support overlay text */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 bg-gradient-to-t ${
                    isFocus
                      ? 'opacity-100 from-black/85 via-black/15 to-transparent'
                      : 'opacity-60 from-black/70 to-transparent'
                  }`}
                />

                {/* Live badge (always visible if live) */}
                {tileLive && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    Live
                  </span>
                )}

                {/* Focused-state overlay: pill, title art, badges */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    isFocus ? 'opacity-100 delay-100' : 'opacity-0'
                  }`}
                >
                  {/* N · SERIES pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-sm bg-primary text-white text-[10px] font-black">
                      N
                    </span>
                    <span>{isSeries(c) ? 'Series' : 'Film'}</span>
                  </div>

                  {/* Badges on the right */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {tileNewSeason && (
                      <span className="inline-flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {tileNewSeason}
                      </span>
                    )}
                    {award && (
                      <span className="inline-flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200 border border-amber-200/30">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5z" />
                        </svg>
                        {award}
                      </span>
                    )}
                  </div>

                  {/* Title image / text along the bottom */}
                  <div className="absolute bottom-4 left-4 right-4">
                    {titleArt ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={titleArt}
                        alt={displayTitle(c)}
                        className="max-h-20 w-auto drop-shadow-2xl"
                      />
                    ) : (
                      <h3 className="solid-title text-2xl sm:text-3xl text-white max-w-[70%]">
                        {displayTitle(c)}
                      </h3>
                    )}
                  </div>
                </div>

                {/* Non-focused tile centre label (small, fades out when focused) */}
                <div
                  className={`absolute inset-x-2 bottom-2 transition-opacity duration-200 ${
                    isFocus ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <p className="text-xs font-semibold text-white line-clamp-1 drop-shadow">
                    {displayTitle(c)}
                  </p>
                </div>
              </Link>
            );
          })}

          {teaserUrl(focused) && (
            <MuteToggle
              muted={muted}
              onClick={() => setMuted((m) => !m)}
              className="absolute bottom-3 right-3 z-20"
            />
          )}
        </div>

        {/* Metadata strip below the row — desktop only; on touch devices there's
            no hover-to-focus, so this just adds clutter under the posters. */}
        <div className="mt-4 max-w-3xl hidden sm:block" key={focused._id}>
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-text-primary animate-fade-in">
            {genre && <li>{genre}</li>}
            {genre && (year || seriesLabel) && (
              <li aria-hidden className="text-text-tertiary">·</li>
            )}
            {year && <li>{year}</li>}
            {year && (seriesLabel || runtime) && (
              <li aria-hidden className="text-text-tertiary">·</li>
            )}
            {seriesLabel && <li>{seriesLabel}</li>}
            {!seriesLabel && runtime && <li>{runtime}</li>}
            {rating && (
              <>
                <li aria-hidden className="text-text-tertiary">·</li>
                <li>
                  <RatingBadge rating={rating} system={ratingSystem} compact />
                </li>
              </>
            )}
            {isPaywalled(focused) && focused.paywall?.mode && (
              <>
                <li aria-hidden className="text-text-tertiary">·</li>
                <li className="text-primary uppercase tracking-wider text-xs">
                  {focused.paywall.mode}
                </li>
              </>
            )}
          </ul>
          {displayDescription(focused) && (
            <p className="mt-2 text-sm text-text-secondary line-clamp-2 animate-fade-in">
              {displayDescription(focused)}
            </p>
          )}
        </div>
      </div>
    </section>
    </>
  );
}
