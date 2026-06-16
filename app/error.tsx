'use client';

import { StatePlaceholder } from '@/components/StatePlaceholder';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div onClick={reset} className="cursor-pointer">
      <StatePlaceholder kind="error" message={error.message} />
    </div>
  );
}
