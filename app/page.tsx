import { api } from '@/lib/api';
import { getPublisherConfig } from '@/lib/config';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { FocusRow } from '@/components/FocusRow';
import { EditorialRow } from '@/components/EditorialRow';
import { StatePlaceholder } from '@/components/StatePlaceholder';
import { isFeedable } from '@/lib/types';

export const revalidate = 60;

export default async function HomePage() {
  const config = await getPublisherConfig();
  let homepage;
  try {
    homepage = await api.homepage();
  } catch (e) {
    return <StatePlaceholder kind="error" message={(e as Error).message} retryHref="/" />;
  }

  const hero = (homepage.hero ?? []).filter(isFeedable);
  const rows = (homepage.rows ?? []).filter((r) => (r.items?.length ?? 0) > 0);

  if (hero.length === 0 && rows.length === 0) {
    return <StatePlaceholder kind="empty" message="No content available yet." />;
  }

  return (
    <div className="pb-12">
      {hero.length > 0 && (
        <HeroBanner
          items={hero}
          showRating={config.ageRatingsEnabled}
          ratingSystem={config.ageRatingSystem}
        />
      )}

      <div className="relative z-10 space-y-2">
        {rows.map((row, i) => {
          const key = (row.genre?._id ?? i) + '_' + i;
          const items = row.items ?? [];
          const rowTitle = row.genre?.name ?? 'Featured';
          const tile = row.tileType === 'landscape' ? 'landscape' : 'portrait';
          const viewAllHref = row.genre?._id ? `/browse/${row.genre._id}` : undefined;
          const props = {
            title: rowTitle,
            items,
            showRating: config.ageRatingsEnabled,
            ratingSystem: config.ageRatingSystem,
            viewAllHref,
          };

          if (row.tileStyle === 'focused' && items.length >= 2) {
            return <FocusRow key={key} {...props} />;
          }
          if (row.tileStyle === 'editorial') {
            return <EditorialRow key={key} {...props} />;
          }
          return <ContentRow key={key} {...props} tile={tile} />;
        })}
      </div>
    </div>
  );
}
