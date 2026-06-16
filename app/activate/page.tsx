'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function ActivatePage() {
  const initial = useSearchParams().get('code') || '';
  const [code, setCode] = useState(initial);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'needsPlan' | 'error'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setState('sending');
    const r = await fetch('/api/auth/activate-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase().trim() }),
    });
    if (r.ok) {
      setState('done');
      return;
    }
    if (r.status === 401) {
      window.location.href = `/login?next=/activate?code=${encodeURIComponent(code)}`;
      return;
    }
    if (r.status === 402) {
      setState('needsPlan');
      return;
    }
    const data = await r.json().catch(() => ({}));
    setState('error');
    setErr(data.error || 'Activation failed');
  }

  if (state === 'done') {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center space-y-4">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold">TV activated</h1>
        <p className="text-text-secondary">
          You can close this tab and head back to your TV.
        </p>
      </div>
    );
  }

  if (state === 'needsPlan') {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center space-y-4">
        <div className="text-6xl">🎟️</div>
        <h1 className="text-2xl font-bold">Pick a plan</h1>
        <p className="text-text-secondary">You need an active subscription to activate this device.</p>
        <Link
          href="/subscribe"
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary/90"
        >
          See plans
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Activate your TV</h1>
      <p className="text-text-secondary text-sm mb-8">
        Enter the 6-character code shown on your TV screen.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          required
          autoFocus
          className="w-full rounded-md border border-border bg-card px-4 py-4 text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        {err && (
          <p className="rounded-md bg-red-500/10 border border-red-500/30 text-red-200 px-3 py-2 text-sm">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={state === 'sending' || code.length < 6}
          className="w-full inline-flex items-center justify-center px-4 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          {state === 'sending' ? 'Activating…' : 'Activate TV'}
        </button>
      </form>
    </div>
  );
}
