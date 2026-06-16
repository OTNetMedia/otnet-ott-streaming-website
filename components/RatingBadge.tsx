const TONE: Record<string, string> = {
  U: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  G: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PG: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30',
  '12': 'bg-orange-500/15 text-orange-200 border-orange-500/30',
  '12A': 'bg-orange-500/15 text-orange-200 border-orange-500/30',
  'PG-13': 'bg-orange-500/15 text-orange-200 border-orange-500/30',
  '15': 'bg-pink-500/15 text-pink-200 border-pink-500/30',
  '18': 'bg-red-500/15 text-red-200 border-red-500/30',
  R: 'bg-red-500/15 text-red-200 border-red-500/30',
  R18: 'bg-red-800/30 text-red-300 border-red-500/40',
  'NC-17': 'bg-red-800/30 text-red-300 border-red-500/40',
};

export function RatingBadge({
  rating,
  system,
  compact,
}: {
  rating: string;
  system?: string;
  compact?: boolean;
}) {
  const tone =
    TONE[rating.toUpperCase()] ?? 'bg-zinc-500/15 text-zinc-200 border-zinc-500/30';
  return (
    <span
      className={`inline-flex items-center rounded border font-semibold tracking-wider ${tone} ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      }`}
      title={system ? `${system}: ${rating}` : rating}
    >
      {rating}
    </span>
  );
}
