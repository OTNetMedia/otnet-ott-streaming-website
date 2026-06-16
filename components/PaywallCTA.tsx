'use client';

import type { PaywallBlock } from '@/lib/types';
import { formatPrice } from '@/lib/types';

export function PaywallCTA({ contentId, paywall }: { contentId: string; paywall: PaywallBlock }) {
  const mode = paywall.mode;
  const amount = paywall.detail?.amount;
  const currency = paywall.detail?.currency;
  const windowHours = paywall.detail?.windowHours;
  const reason = paywall.reason;

  const label =
    reason === 'signin_required'
      ? 'Sign in to watch'
      : mode === 'ppv'
        ? `Buy${amount ? ` for ${formatPrice(amount, currency)}` : ''}`
        : mode === 'rental'
          ? `Rent${amount ? ` for ${formatPrice(amount, currency)}` : ''}${windowHours ? ` · ${windowHours}h` : ''}`
          : reason === 'wrong_plan'
            ? 'Upgrade plan'
            : reason === 'expired'
              ? 'Rent again'
              : 'Subscribe to watch';

  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent('otnet-paywall', { detail: { ...paywall, contentId } }));
      }}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
    >
      {label}
    </button>
  );
}
