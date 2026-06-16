import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { getPublisherConfig } from '@/lib/config';
import { StatePlaceholder } from '@/components/StatePlaceholder';
import { EPGGrid } from '@/components/EPGGrid';
import type { EPGChannel, EPGProgram } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Live TV' };

// Window the EPG covers — `back` hours before now, `ahead` hours after.
const BACK_HOURS = 1;
const AHEAD_HOURS = 24;

// The dashboard endpoint returns programName + durationSeconds; the legacy
// /catalog/epg returns title + endTime. Normalise so the grid only sees one
// shape (title + startTime + endTime).
function normalizeProgram(p: EPGProgram): EPGProgram {
  const start = p.startTime ? new Date(p.startTime).getTime() : 0;
  const endFromDuration =
    start && p.durationSeconds
      ? new Date(start + p.durationSeconds * 1000).toISOString()
      : undefined;
  return {
    ...p,
    title: p.content?.title || p.programName || p.title,
    description: p.content?.description || p.description,
    endTime: p.endTime || endFromDuration,
  };
}

export default async function LiveTVPage() {
  const config = await getPublisherConfig();
  if (!config.epgEnabled) notFound();

  // 1) Get the list of channels. /catalog/channels has the richer metadata;
  //    fall back to /catalog/epg if it fails.
  let channelList: EPGChannel[] = [];
  try {
    const resp = await api.channels();
    channelList = (resp.channels ?? []).map((c) => ({
      channel: {
        _id: c._id,
        name: c.name,
        logo: c.logo,
      },
      programs: [],
    }));
  } catch {
    try {
      const fallback = await api.epg();
      channelList = fallback.channels ?? [];
    } catch (e) {
      return <StatePlaceholder kind="error" message={(e as Error).message} retryHref="/epg" />;
    }
  }

  console.log(`[EPG] fetched ${channelList.length} channels`);

  // 2) Pull each channel's full schedule in parallel from the dashboard
  //    endpoint. Channels with no schedule get an empty program list and
  //    fall through to the EPG grid's "live loop" rendering.
  const enriched = await Promise.all(
    channelList.map(async (row): Promise<EPGChannel> => {
      const id = row.channel?._id;
      if (!id) return row;
      try {
        const data = await api.channelEpg(id, {
          back: BACK_HOURS,
          ahead: AHEAD_HOURS,
        });
        const programs = data.channels?.[0]?.programs ?? [];
        console.log(
          `[EPG] channel ${id} (${row.channel?.name}) — ${programs.length} programs`,
        );
        return {
          ...row,
          channel: row.channel,
          programs: programs.map(normalizeProgram),
        };
      } catch (e) {
        console.log(
          `[EPG] channel ${id} (${row.channel?.name}) — fetch failed: ${(e as Error).message}`,
        );
        return row;
      }
    }),
  );

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Live TV</h1>
          <p className="text-sm text-text-tertiary mt-1">
            {enriched.length} {enriched.length === 1 ? 'channel' : 'channels'} on now ·
            scroll the timeline to browse the full schedule
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          Updating live
        </div>
      </div>

      <EPGGrid channels={enriched} renderedAt={Date.now()} />
    </div>
  );
}
