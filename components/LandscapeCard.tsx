import Link from 'next/link';
import {
  type Content,
  displayTitle,
  displayYear,
  isSeries,
  landscapeUrl,
  primaryGenreName,
} from '@/lib/types';
import { RatingBadge } from './RatingBadge';

export function LandscapeCard({
  content,
  showRating,
  ratingSystem,
}: {
  content: Content;
  showRating: boolean;
  ratingSystem?: string;
}) {
  const art = landscapeUrl(content);
  const year = displayYear(content);
  const genre = primaryGenreName(content);
  const rating = showRating ? content.ageRating : undefined;
  const live = content.broadcastStatus === 'live';

  return (
    <Link
      href={`/content/${content._id}`}
      className="group block w-full overflow-hidden rounded-md border border-border bg-card transition-transform duration-200 hover:scale-[1.04] hover:z-10 hover:shadow-prime"
    >
      <div className="relative aspect-video">
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={art}
            alt={displayTitle(content)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-sm text-text-secondary">
            {displayTitle(content)}
          </div>
        )}
        {live && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
          </span>
        )}
        {rating && (
          <div className="absolute bottom-2 right-2">
            <RatingBadge rating={rating} system={ratingSystem} compact />
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-text-primary">
          {displayTitle(content)}
        </h3>
        <ul className="flex items-center gap-2 text-[11px] text-text-tertiary">
          {year && <li>{year}</li>}
          {isSeries(content) && <li>· Series</li>}
          {genre && <li>· {genre}</li>}
        </ul>
      </div>
    </Link>
  );
}
