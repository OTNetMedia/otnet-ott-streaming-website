'use client';

import Script from 'next/script';

export function Player({
  contentId,
  viewerToken,
  profileIndex = 0,
}: {
  contentId: string;
  viewerToken?: string;
  profileIndex?: number;
}) {
  return (
    <>
      <Script src="https://otnet.io/js/otnet-player.js" strategy="afterInteractive" />
      <otnet-video-player
        content-ids={contentId}
        viewer-token={viewerToken ?? undefined}
        profile-index={profileIndex}
        autoplay
        style={{ width: '100%', aspectRatio: '16 / 9', display: 'block', background: '#000' }}
      />
    </>
  );
}

export function ChannelPlayer({ channelId }: { channelId: string }) {
  return (
    <>
      <Script src="https://otnet.io/js/otnet-player.js" strategy="afterInteractive" />
      <otnet-video-player
        channel-ids={channelId}
        autoplay
        style={{ width: '100%', aspectRatio: '16 / 9', display: 'block', background: '#000' }}
      />
    </>
  );
}

export function PaywallHandler({ contentId }: { contentId: string }) {
  return <otnet-paywall-handler content-id={contentId} />;
}

export function RentalCountdown({ expiresAt }: { expiresAt: string }) {
  return <otnet-rental-countdown expires-at={expiresAt} />;
}
