'use client';

import { useEffect, useRef, useState } from 'react';
import { type Content, isFeedable } from '@/lib/types';
import { LandscapeCard } from './LandscapeCard';
import { PosterCard } from './PosterCard';

export function ContentRow({
  title,
  items,
  tile = 'portrait',
  showRating,
  ratingSystem,
}: {
  title: string;
  items: Content[];
  tile?: 'portrait' | 'landscape';
  showRating: boolean;
  ratingSystem?: string;
}) {
  const visible = items.filter(isFeedable);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setEdges({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [visible.length]);

  function nudge(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === 'left' ? -el.clientWidth : el.clientWidth,
      behavior: 'smooth',
    });
  }

  if (visible.length === 0) return null;

  return (
    <section className="space-y-3 py-4">
      <div className="px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h2>
        <div className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => nudge('left')}
            disabled={!edges.left}
            aria-label={`Scroll ${title} left`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-card border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => nudge('right')}
            disabled={!edges.right}
            aria-label={`Scroll ${title} right`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-card border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12">
        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-3 overflow-x-auto py-6 -my-4 snap-x scroll-smooth"
        >
          {visible.map((c, i) => {
            const position: 'first' | 'last' | 'middle' =
              i === 0 ? 'first' : i === visible.length - 1 ? 'last' : 'middle';
            return tile === 'portrait' ? (
              <div
                key={c._id}
                className="w-32 sm:w-36 lg:w-[calc((100%-84px)/8)] shrink-0 snap-start"
              >
                <PosterCard
                  content={c}
                  showRating={showRating}
                  ratingSystem={ratingSystem}
                  position={position}
                />
              </div>
            ) : (
              <div
                key={c._id}
                className="w-64 sm:w-72 lg:w-[calc((100%-48px)/5)] shrink-0 snap-start"
              >
                <LandscapeCard
                  content={c}
                  showRating={showRating}
                  ratingSystem={ratingSystem}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
