import Link from 'next/link';
import { api } from '@/lib/api';
import {
  type Content,
  contentDuration,
  formatRuntime,
  hasPlayableVariant,
  isPaywalled,
  landscapeUrl,
} from '@/lib/types';

async function fetchSeasons(seriesId: string): Promise<Content[]> {
  try {
    const { items } = await api.children(seriesId);
    return (items ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch {
    return [];
  }
}

async function fetchEpisodes(seasonId: string): Promise<Content[]> {
  try {
    const { items } = await api.children(seasonId);
    return (items ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch {
    return [];
  }
}

export async function EpisodeList({
  seriesId,
  selectedSeason,
}: {
  seriesId: string;
  selectedSeason?: string;
}) {
  const seasons = await fetchSeasons(seriesId);

  if (seasons.length === 0) return null;

  const activeId =
    seasons.find((s) => s._id === selectedSeason)?._id ?? seasons[0]._id;
  const episodes = await fetchEpisodes(activeId);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 space-y-4">
      <h2 className="text-xl font-bold">Episodes</h2>

      {seasons.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {seasons.map((s, i) => (
            <Link
              key={s._id}
              href={`?season=${s._id}`}
              scroll={false}
              className={`px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap border ${
                s._id === activeId
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-text-secondary border-border hover:border-primary/40'
              }`}
            >
              {s.title ?? `Season ${i + 1}`}
            </Link>
          ))}
        </div>
      )}

      {episodes.length === 0 ? (
        <p className="text-text-tertiary text-sm">No episodes yet.</p>
      ) : (
        <ol className="space-y-3">
          {episodes.map((ep, i) => {
            const art = landscapeUrl(ep);
            const runtime = formatRuntime(contentDuration(ep));
            const playable = hasPlayableVariant(ep);
            const locked = isPaywalled(ep);
            const href = playable && !locked ? `/watch/${ep._id}` : `/content/${ep._id}`;
            return (
              <li key={ep._id}>
                <Link
                  href={href}
                  className="group flex gap-4 rounded-md border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors"
                >
                  <div className="relative w-44 sm:w-56 shrink-0 aspect-video bg-muted">
                    {art && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-3 pr-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-text-tertiary text-xs">EP {i + 1}</span>
                      <h3 className="font-semibold line-clamp-1">
                        {ep.media?.[0]?.title ?? ep.title ?? 'Untitled'}
                      </h3>
                    </div>
                    {(ep.media?.[0]?.overview ?? ep.description) && (
                      <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                        {ep.media?.[0]?.overview ?? ep.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                      {runtime && <span>{runtime}</span>}
                      {locked && (
                        <span className="rounded bg-primary/15 px-2 py-0.5 text-primary uppercase tracking-wider">
                          {ep.paywall?.mode ?? 'Locked'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
