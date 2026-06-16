import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { getPublisherConfig } from '@/lib/config';
import { displayTitle, isPaywalled } from '@/lib/types';
import { Player, PaywallHandler } from '@/components/Player';

export const dynamic = 'force-dynamic';

export default async function Watch({ params }: { params: { id: string } }) {
  const config = await getPublisherConfig();
  const viewerToken = cookies().get('otnet_viewer')?.value;

  if (!config.viewerAuthNone && !viewerToken) {
    redirect(`/login?next=/watch/${params.id}`);
  }

  let content;
  try {
    content = await api.content(params.id);
  } catch {
    content = undefined;
  }

  if (content && isPaywalled(content)) {
    redirect(`/content/${params.id}`);
  }

  return (
    <main className="bg-black min-h-screen">
      <div className="px-2 sm:px-4 lg:px-12 py-4">
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/content/${params.id}`}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </Link>
          {content && (
            <h1 className="text-sm font-semibold text-text-primary line-clamp-1">
              {displayTitle(content)}
            </h1>
          )}
          <span className="w-16" />
        </div>
        <div className="rounded-lg overflow-hidden shadow-prime border border-border bg-black">
          <Player contentId={params.id} viewerToken={viewerToken} />
        </div>
        <PaywallHandler contentId={params.id} />
      </div>
    </main>
  );
}
