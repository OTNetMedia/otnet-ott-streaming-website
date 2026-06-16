import Link from 'next/link';
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
  posterUrl,
} from '@/lib/types';
import { RatingBadge } from './RatingBadge';

// Stable pseudo-random hue per content id so the missing-art fallback feels
// intentional rather than identical.
function hueFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function PosterCard({
  content,
  showRating,
  ratingSystem,
}: {
  content: Content;
  showRating: boolean;
  ratingSystem?: string;
  position?: 'first' | 'last' | 'middle';
}) {
  const poster = posterUrl(content);
  const title = displayTitle(content);
  const description = displayDescription(content);
  const year = displayYear(content);
  const runtime = formatRuntime(contentDuration(content));
  const rating = showRating ? content.ageRating : undefined;
  const live = content.broadcastStatus === 'live';
  const locked = isPaywalled(content);
  const series = isSeries(content);
  const genres = allGenreNames(content, 2);
  const hue = hueFor(content._id);

  return (
    <Link
      href={`/content/${content._id}`}
      className="group relative block aspect-[2/3] overflow-hidden rounded-md border border-border bg-card transition-all duration-300 ease-out hover:z-20 hover:border-primary/80 hover:shadow-[0_18px_45px_-12px_rgba(229,9,20,0.55)]"
    >
      {/* Poster art (with subtle Ken Burns zoom on hover) */}
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.15] group-hover:saturate-125 group-hover:brightness-110"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
          style={{
            background: `linear-gradient(135deg, hsl(${hue}, 60%, 22%) 0%, hsl(${(hue + 60) % 360}, 60%, 14%) 100%)`,
          }}
        >
          <span className="text-base font-bold text-white leading-tight line-clamp-3 drop-shadow">
            {title}
          </span>
          {year && <span className="mt-2 text-[11px] text-white/70">{year}</span>}
        </div>
      )}

      {/* Diagonal shine sweep — runs once on hover entry */}
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />

      {/* Static badges (always visible) */}
      {live && (
        <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
        </span>
      )}
      {locked && !live && (
        <span
          className="absolute top-2 left-2 z-10 inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-400/95 text-black shadow-lg"
          title="Premium"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11H5zm0 3h14v2H5v-2z" />
          </svg>
        </span>
      )}
      {rating && (
        <div className="absolute top-2 right-2 z-10">
          <RatingBadge rating={rating} system={ratingSystem} compact />
        </div>
      )}

      {/* Centre Play button — pops in on hover */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 scale-50 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-2xl ring-4 ring-white/30 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="black">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Sliding metadata drawer — reveals from bottom on hover */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black via-black/95 to-black/0 p-3 backdrop-blur-sm transition-transform duration-300 ease-out group-hover:translate-y-0"
      >
        <h3 className="line-clamp-1 text-sm font-bold text-white drop-shadow">
          {title}
        </h3>
        <ul className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium text-white/80">
          {year && <li>{year}</li>}
          {(runtime || series) && <li aria-hidden>·</li>}
          {series ? <li>Series</li> : runtime && <li>{runtime}</li>}
          {genres[0] && (
            <>
              <li aria-hidden>·</li>
              <li className="text-primary">{genres[0]}</li>
            </>
          )}
        </ul>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-white/70">
            {description}
          </p>
        )}
      </div>

      {/* Primary-coloured inner glow ring on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-md opacity-0 transition-opacity duration-300 group-hover:opacity-100 ring-1 ring-inset ring-primary/40" />
    </Link>
  );
}
