import { api } from '@/lib/api';
import { getPublisherConfig } from '@/lib/config';
import { PosterCard } from '@/components/PosterCard';
import { SearchBar } from '@/components/SearchBar';
import { StatePlaceholder } from '@/components/StatePlaceholder';
import { isFeedable } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Search' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const config = await getPublisherConfig();
  const q = (searchParams.q ?? '').trim();

  let results;
  try {
    results = q ? await api.search(q) : { items: [] as never[] };
  } catch (e) {
    return <StatePlaceholder kind="error" message={(e as Error).message} retryHref={`/search?q=${q}`} />;
  }

  const items = (results.items ?? []).filter(isFeedable);

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Search</h1>
      <SearchBar autoFocus />

      {!q ? (
        <p className="text-text-tertiary text-sm">Type to find titles, genres, or people.</p>
      ) : items.length === 0 ? (
        <StatePlaceholder kind="empty" message={`No results for “${q}”.`} />
      ) : (
        <>
          <p className="text-sm text-text-tertiary">
            {items.length} {items.length === 1 ? 'result' : 'results'} for “{q}”
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((c) => (
              <PosterCard
                key={c._id}
                content={c}
                showRating={config.ageRatingsEnabled}
                ratingSystem={config.ageRatingSystem}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
