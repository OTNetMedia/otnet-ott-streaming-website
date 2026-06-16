import Link from 'next/link';

export function StatePlaceholder({
  kind,
  message,
  retryHref,
}: {
  kind: 'loading' | 'empty' | 'error';
  message?: string;
  retryHref?: string;
}) {
  const fallback =
    kind === 'loading' ? 'Loading…' : kind === 'empty' ? 'Nothing to show yet.' : 'Something went wrong.';
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-text-secondary text-center">
      {kind === 'loading' ? (
        <div
          className="h-10 w-10 rounded-full border-2 border-white/10 border-t-primary animate-spin"
          aria-hidden
        />
      ) : (
        <div className="text-3xl" aria-hidden>
          {kind === 'empty' ? '📭' : '⚠️'}
        </div>
      )}
      <p className="max-w-md">{message ?? fallback}</p>
      {kind === 'error' && retryHref && (
        <Link
          href={retryHref}
          className="px-4 py-2 rounded-md bg-primary text-white font-medium hover:bg-primary/90"
        >
          Retry
        </Link>
      )}
    </div>
  );
}
