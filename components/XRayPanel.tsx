'use client';

import { useState } from 'react';
import type { Content } from '@/lib/types';

// X-Ray-style tabbed metadata panel — Prime Video's signature detail-page feature.
// Surfaces Cast & Crew, free-form metadata rows, and content advisories
// in a single dense sidebar widget.
type Tab = 'cast' | 'details' | 'advisory';

export function XRayPanel({ content }: { content: Content }) {
  const cast = content.personnel ?? [];
  const meta = content.metadata ?? [];
  const advisories = content.contentAdvisory ?? [];

  const initial: Tab = cast.length ? 'cast' : meta.length ? 'details' : 'advisory';
  const [tab, setTab] = useState<Tab>(initial);

  const tabs = (
    [
      { id: 'cast', label: 'Cast & crew', count: cast.length },
      { id: 'details', label: 'Details', count: meta.length },
      { id: 'advisory', label: 'Advisory', count: advisories.length },
    ] satisfies { id: Tab; label: string; count: number }[]
  ).filter((t) => t.count > 0);

  if (tabs.length === 0) return null;

  return (
    <aside className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="inline-flex items-center justify-center h-7 w-7 rounded bg-primary/15 text-primary font-bold text-xs">
          X-Ray
        </span>
        <span className="text-xs uppercase tracking-wider text-text-tertiary">
          On screen now
        </span>
      </div>

      <div className="flex border-b border-border" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t.label}
            <span className="ml-1 text-[10px] opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="p-4 max-h-[420px] overflow-y-auto">
        {tab === 'cast' && (
          <ul className="space-y-3">
            {cast.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                {p.person?.headshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.person.headshot}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-text-tertiary text-sm">
                    {p.person?.name?.[0]?.toUpperCase() ?? '·'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary line-clamp-1">
                    {p.person?.name}
                  </p>
                  {p.role && (
                    <p className="text-xs text-text-tertiary line-clamp-1">{p.role}</p>
                  )}
                  {p.person?.title && (
                    <p className="text-[11px] text-text-tertiary line-clamp-1">
                      {p.person.title}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === 'details' && (
          <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-sm">
            {meta.map((m, i) => (
              <div key={i} className="contents">
                <dt className="text-text-tertiary">{m.key}</dt>
                <dd className="text-text-primary">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {tab === 'advisory' && (
          <ul className="flex flex-wrap gap-2">
            {advisories.map((a, i) => (
              <li
                key={i}
                className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200 uppercase tracking-wider"
              >
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
