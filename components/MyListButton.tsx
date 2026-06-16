'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function MyListButton({
  contentId,
  initialOnList,
  className,
}: {
  contentId: string;
  initialOnList?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [onList, setOnList] = useState(!!initialOnList);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  // If we don't know the initial state, fetch it once on mount.
  useEffect(() => {
    if (initialOnList !== undefined) return;
    let cancelled = false;
    fetch('/api/viewer/list', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: { _id?: string }[] }) => {
        if (cancelled) return;
        setOnList(!!data.items?.some((i) => i._id === contentId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [contentId, initialOnList]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const next = !onList;
    setOnList(next);
    setBusy(true);
    try {
      const r = await fetch(
        next ? '/api/viewer/list' : `/api/viewer/list?contentId=${encodeURIComponent(contentId)}`,
        {
          method: next ? 'POST' : 'DELETE',
          headers: next ? { 'Content-Type': 'application/json' } : undefined,
          body: next ? JSON.stringify({ contentId }) : undefined,
        },
      );
      if (!r.ok) {
        if (r.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        // Roll back optimistic update on failure
        setOnList(!next);
      } else {
        startTransition(() => router.refresh());
      }
    } catch {
      setOnList(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={onList}
      aria-label={onList ? 'Remove from My List' : 'Add to My List'}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-md bg-white/15 px-5 py-2.5 sm:py-3 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/25 border border-white/10 disabled:opacity-60'
      }
    >
      {onList ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5L20 7" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      )}
      {onList ? 'On My List' : 'My List'}
    </button>
  );
}
