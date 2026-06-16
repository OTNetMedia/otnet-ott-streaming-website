import Link from 'next/link';
import { api } from '@/lib/api';
import { StatePlaceholder } from '@/components/StatePlaceholder';
import type { Category } from '@/lib/types';

export const revalidate = 300;

export const metadata = { title: 'Browse' };

function categoryImage(cat: Category): string | undefined {
  const land = cat.image?.landscape?.trim();
  if (land) return land;
  const port = cat.image?.portrait?.trim();
  return port || undefined;
}

function hueFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

export default async function BrowsePage() {
  let categories;
  try {
    categories = await api.categories();
  } catch (e) {
    return <StatePlaceholder kind="error" message={(e as Error).message} retryHref="/browse" />;
  }

  if (!categories || categories.length === 0) {
    return <StatePlaceholder kind="empty" message="No categories yet." />;
  }

  // Surface only categories the publisher marked for nav; sort by their order.
  const visible = categories
    .filter((c) => c.showInSidebar !== false)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Browse</h1>
      <p className="text-text-secondary text-sm mb-6">
        Pick a category to see everything in it.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map((cat) => {
          const art = categoryImage(cat);
          const hue = hueFor(cat._id);
          return (
            <Link
              key={cat._id}
              href={`/browse/${cat._id}`}
              className="group relative aspect-[16/9] overflow-hidden rounded-md border border-border bg-card transition-all duration-300 hover:scale-[1.03] hover:border-primary/50 hover:shadow-prime"
            >
              {art ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={art}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:saturate-125"
                  loading="lazy"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, hsl(${hue}, 70%, 22%) 0%, hsl(${(hue + 80) % 360}, 70%, 14%) 100%)`,
                  }}
                />
              )}

              {/* Dim overlay so title sits readably over any image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-300 group-hover:from-black/60" />

              {/* Subtle red sweep on hover */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-primary/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

              <div className="relative z-10 flex h-full items-end p-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white drop-shadow leading-tight">
                    {cat.name ?? 'Untitled'}
                  </h2>
                  {cat.description && (
                    <p className="mt-1 text-xs text-white/70 line-clamp-2">{cat.description}</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
