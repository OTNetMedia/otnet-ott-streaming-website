import Link from 'next/link';
import { api } from '@/lib/api';
import { getPublisherConfig } from '@/lib/config';
import { PosterCard } from '@/components/PosterCard';
import { StatePlaceholder } from '@/components/StatePlaceholder';
import { isFeedable } from '@/lib/types';

export const revalidate = 60;

export default async function CategoryDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const config = await getPublisherConfig();

  let data;
  try {
    data = await api.contentByCat(params.id, page);
  } catch (e) {
    return (
      <StatePlaceholder
        kind="error"
        message={(e as Error).message}
        retryHref={`/browse/${params.id}`}
      />
    );
  }

  const items = (data.items ?? []).filter(isFeedable);

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8">
      <Link href="/browse" className="text-xs uppercase tracking-wider text-text-tertiary hover:text-text-primary">
        ← All categories
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold mt-2 mb-6">Category</h1>

      {items.length === 0 ? (
        <StatePlaceholder kind="empty" message="No titles in this category." />
      ) : (
        <>
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

          {(data.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-between mt-8 text-sm">
              {page > 1 ? (
                <Link
                  href={`/browse/${params.id}?page=${page - 1}`}
                  className="px-4 py-2 rounded-md bg-card border border-border hover:border-primary/40"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-text-tertiary">
                Page {data.page ?? page} of {data.totalPages}
              </span>
              {(data.page ?? page) < (data.totalPages ?? 1) ? (
                <Link
                  href={`/browse/${params.id}?page=${page + 1}`}
                  className="px-4 py-2 rounded-md bg-card border border-border hover:border-primary/40"
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
