import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getPublisherConfig } from '@/lib/config';
import { getActiveProfileIndex } from '@/lib/profile';
import { PosterCard } from '@/components/PosterCard';
import { StatePlaceholder } from '@/components/StatePlaceholder';
import type { Content } from '@/lib/types';
import { isFeedable } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My List' };

export default async function MyListPage() {
  const config = await getPublisherConfig();
  if (!config.myListEnabled) notFound();
  if (config.viewerAuthNone) notFound();

  const viewerToken = cookies().get('otnet_viewer')?.value;
  if (!viewerToken) redirect('/login?next=/my-list');

  const profileIndex = getActiveProfileIndex();
  let items: Content[] = [];
  try {
    const res = await apiFetch<{ items?: Content[] }>(
      `/viewer/list?profileIndex=${profileIndex}`,
      { revalidate: 0 },
    );
    items = (res.items ?? []).filter(isFeedable);
  } catch {
    items = [];
  }

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">My List</h1>
      {items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl">📺</div>
          <p className="text-text-secondary">Your list is empty.</p>
          <Link
            href="/browse"
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary/90"
          >
            Browse titles
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}
