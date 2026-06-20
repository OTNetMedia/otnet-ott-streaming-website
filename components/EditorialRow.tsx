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
  landscapeUrl,
  posterUrl,
  titleImageUrl,
} from '@/lib/types';
import { RatingBadge } from './RatingBadge';

// Editorial style — larger landscape cards with the title and synopsis
// visible permanently below the art. Renders 4 per row at desktop and
// degrades to 2/1 columns on smaller screens.
export function EditorialRow({
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
  const visible = items.slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <section className="space-y-3 py-6">
      <div className="px-4 sm:px-8 lg:px-12">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h2>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-tertiary">
              Editor’s picks
            </span>
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
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {visible.map((c) => {
            const art = landscapeUrl(c) ?? posterUrl(c);
            const titleArt = titleImageUrl(c);
            const year = displayYear(c);
            const runtime = formatRuntime(contentDuration(c));
            const rating = showRating ? c.ageRating : undefined;
            const genres = allGenreNames(c, 2);
            const live = c.broadcastStatus === 'live';
            const locked = isPaywalled(c);

            return (
              <Link
                key={c._id}
                href={`/content/${c._id}`}
                className="group flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
              >
                <div className="relative aspect-video bg-muted">
                  {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={art}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/0 to-transparent" />

                  {live && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      Live
                    </span>
                  )}
                  {rating && (
                    <div className="absolute top-2 right-2">
                      <RatingBadge rating={rating} system={ratingSystem} compact />
                    </div>
                  )}

                  <div className="absolute inset-x-3 bottom-3">
                    {titleArt ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={titleArt}
                        alt={displayTitle(c)}
                        className="max-h-12 w-auto drop-shadow-2xl"
                      />
                    ) : (
                      <h3 className="text-base sm:text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow">
                        {displayTitle(c)}
                      </h3>
                    )}
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-tertiary">
                    {year && <li>{year}</li>}
                    {year && (runtime || genres.length) && <li aria-hidden>·</li>}
                    {isSeries(c) ? (
                      <li>Series</li>
                    ) : (
                      runtime && <li>{runtime}</li>
                    )}
                    {genres.length > 0 && <li aria-hidden>·</li>}
                    {genres.length > 0 && <li>{genres.join(' · ')}</li>}
                    {locked && c.paywall?.mode && (
                      <>
                        <li aria-hidden>·</li>
                        <li className="text-primary font-semibold uppercase tracking-wider">
                          {c.paywall.mode}
                        </li>
                      </>
                    )}
                  </ul>
                  {displayDescription(c) && (
                    <p className="text-xs text-text-secondary line-clamp-2 leading-snug">
                      {displayDescription(c)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
