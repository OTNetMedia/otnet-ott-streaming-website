import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { api, APIError } from '@/lib/api';
import { getPublisherConfig } from '@/lib/config';
import {
  allGenreNames,
  contentDuration,
  displayDescription,
  displayTitle,
  displayYear,
  formatRuntime,
  isSeries,
  studioName,
} from '@/lib/types';
import { ContentHero } from '@/components/ContentHero';
import { EpisodeList } from '@/components/EpisodeList';
import { XRayPanel } from '@/components/XRayPanel';
import { PaywallHandler } from '@/components/Player';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const c = await api.content(params.id);
    return {
      title: displayTitle(c),
      description: displayDescription(c).slice(0, 160) || undefined,
    };
  } catch {
    return { title: 'Content' };
  }
}

export default async function ContentDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { season?: string };
}) {
  const config = await getPublisherConfig();
  let content;
  try {
    content = await api.content(params.id);
  } catch (e) {
    if (e instanceof APIError && e.status === 404) notFound();
    throw e;
  }

  const year = displayYear(content);
  const runtime = formatRuntime(contentDuration(content));
  const genres = allGenreNames(content, 6);
  const advisories = content.contentAdvisory ?? [];
  const isSeriesContent = isSeries(content);
  const studio = studioName(content);
  const cast = content.personnel ?? [];
  const topCast = cast.slice(0, 8);

  return (
    <>
      {!config.viewerAuthNone && (
        <Script src="https://otnet.io/js/otnet-player.js" strategy="afterInteractive" />
      )}
      {!config.viewerAuthNone && <PaywallHandler contentId={content._id} />}

      <article className="pb-16">
        <ContentHero
          content={content}
          showRating={config.ageRatingsEnabled}
          ratingSystem={config.ageRatingSystem}
        />

        <div className="px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2 space-y-8 min-w-0">
            {displayDescription(content) && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-text-tertiary mb-3">
                  Overview
                </h2>
                <p className="text-base leading-relaxed text-text-secondary max-w-3xl">
                  {displayDescription(content)}
                </p>
              </section>
            )}

            {topCast.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-text-tertiary mb-3">
                  Cast & Crew
                </h2>
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-4">
                  {topCast.map((p, i) => {
                    const pid = p.person?._id;
                    const personHref = pid
                      ? `/people/${pid}?${new URLSearchParams({
                          name: p.person?.name ?? '',
                          ...(p.role ? { role: p.role } : {}),
                          ...(p.person?.title ? { title: p.person.title } : {}),
                          ...(p.person?.headshot ? { headshot: p.person.headshot } : {}),
                        }).toString()}`
                      : undefined;
                    const inner = (
                      <>
                        {p.person?.headshot ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.person.headshot}
                            alt=""
                            className="h-12 w-12 rounded-full object-cover border border-border shrink-0 transition-transform group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-text-tertiary text-sm shrink-0">
                            {p.person?.name?.[0]?.toUpperCase() ?? '·'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                            {p.person?.name}
                          </p>
                          {p.role && (
                            <p className="text-xs text-text-tertiary line-clamp-1">{p.role}</p>
                          )}
                        </div>
                      </>
                    );
                    return (
                      <li key={i}>
                        {personHref ? (
                          <Link
                            href={personHref}
                            className="group flex items-center gap-3 min-w-0 rounded-lg p-1.5 -m-1.5 hover:bg-muted/50"
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 min-w-0">{inner}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {advisories.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-text-tertiary mb-3">
                  Maturity & Advisories
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {advisories.map((a) => (
                    <li
                      key={a}
                      className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200 uppercase tracking-wider"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-text-tertiary">
                About this title
              </h3>
              <dl className="text-sm space-y-2">
                {year && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-tertiary">Released</dt>
                    <dd className="text-text-primary font-medium">{year}</dd>
                  </div>
                )}
                {runtime && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-tertiary">Runtime</dt>
                    <dd className="text-text-primary font-medium">{runtime}</dd>
                  </div>
                )}
                {genres.length > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-tertiary shrink-0">Genres</dt>
                    <dd className="text-text-primary text-right">{genres.join(', ')}</dd>
                  </div>
                )}
                {studio && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-tertiary">Studio</dt>
                    <dd className="text-text-primary text-right">{studio}</dd>
                  </div>
                )}
                {isSeriesContent && content.childCount ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-text-tertiary">Seasons</dt>
                    <dd className="text-text-primary font-medium">{content.childCount}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <XRayPanel content={content} />
          </aside>
        </div>

        {isSeriesContent && (
          <div id="episodes" className="pt-12">
            <EpisodeList seriesId={content._id} selectedSeason={searchParams.season} />
          </div>
        )}
      </article>
    </>
  );
}
