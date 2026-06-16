import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { getPublisherConfig } from '@/lib/config';
import { PosterCard } from '@/components/PosterCard';
import type { Content } from '@/lib/types';
import { isFeedable } from '@/lib/types';

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { name?: string };
}): Promise<Metadata> {
  return { title: searchParams.name ?? 'Person' };
}

interface Person {
  _id?: string;
  name?: string;
  title?: string;
  headshot?: string;
  bio?: string;
  birthDate?: string;
  birthplace?: string;
}

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { name?: string; role?: string; headshot?: string; title?: string };
}) {
  const config = await getPublisherConfig();

  // Primary lookup — the dedicated person endpoint. If it doesn't exist for
  // this publisher, gracefully fall back to whatever the calling content
  // page handed us via the query string.
  let person: Person = {};
  try {
    person = await api.person(params.id);
  } catch {
    /* fall through to search-params fallback */
  }

  const name = person?.name || searchParams.name || 'Unknown';
  const title = person?.title || searchParams.title;
  const headshot = person?.headshot || searchParams.headshot;
  const bio = person?.bio;
  const role = searchParams.role;

  // Filmography lookup — same gentle fall-through. Prefer the personnel
  // filter; otherwise hit search by name so the page is never bare.
  let content: Content[] = [];
  try {
    const resp = await api.personContent(params.id);
    content = (resp.items ?? []).filter(isFeedable);
  } catch {
    if (name && name !== 'Unknown') {
      try {
        const resp = await api.search(name);
        content = (resp.items ?? []).filter(isFeedable);
      } catch {
        content = [];
      }
    }
  }

  if (name === 'Unknown' && content.length === 0) notFound();

  return (
    <main className="pb-16">
      {/* Cinematic hero — large headshot, name, title, bio */}
      <section className="relative overflow-hidden">
        {headshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headshot}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />

        <div className="relative px-4 sm:px-8 lg:px-12 pt-24 pb-12">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-text-tertiary hover:text-text-primary mb-8"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-8">
            {headshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headshot}
                alt={name}
                className="h-40 w-40 sm:h-56 sm:w-56 rounded-2xl object-cover shadow-2xl border border-white/10 shrink-0"
              />
            ) : (
              <div className="h-40 w-40 sm:h-56 sm:w-56 rounded-2xl bg-card flex items-center justify-center text-6xl font-black text-primary border border-border shrink-0">
                {name[0]?.toUpperCase() ?? '·'}
              </div>
            )}

            <div className="min-w-0 space-y-2">
              {(title || role) && (
                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-primary">
                  {role || title}
                </p>
              )}
              <h1 className="solid-title text-4xl sm:text-6xl lg:text-7xl">{name}</h1>
              {title && role && title !== role && (
                <p className="text-sm uppercase tracking-[0.2em] text-text-secondary">{title}</p>
              )}
              {(person.birthDate || person.birthplace) && (
                <p className="text-sm text-text-tertiary">
                  {person.birthDate && new Date(person.birthDate).getUTCFullYear()}
                  {person.birthDate && person.birthplace && ' · '}
                  {person.birthplace}
                </p>
              )}
            </div>
          </div>

          {bio && (
            <p className="mt-8 max-w-3xl text-base leading-relaxed text-text-secondary">
              {bio}
            </p>
          )}
        </div>
      </section>

      {/* Filmography */}
      <section className="px-4 sm:px-8 lg:px-12 mt-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg sm:text-xl font-bold">
            {content.length > 0
              ? `Known for · ${content.length} title${content.length === 1 ? '' : 's'}`
              : 'No titles to show yet'}
          </h2>
        </div>

        {content.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {content.map((c) => (
              <PosterCard
                key={c._id}
                content={c}
                showRating={config.ageRatingsEnabled}
                ratingSystem={config.ageRatingSystem}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary max-w-md">
            We couldn't find any other titles associated with {name} in this
            catalogue. Try searching directly or check back later.
          </p>
        )}
      </section>
    </main>
  );
}
