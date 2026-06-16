'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { EPGChannel, EPGProgram } from '@/lib/types';

// Layout constants — denser timeline closer to Prime Video's EPG.
const PX_PER_MIN = 8;
const SLOT_MIN = 30;
const CHANNEL_COL = 340;
const ROW_HEIGHT = 92;
const HEADER_HEIGHT = 44;
const PAST_HOURS = 1;
const FUTURE_HOURS = 24;

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit' });

function snapTo30(ms: number): number {
  return Math.floor(ms / (30 * 60_000)) * (30 * 60_000);
}

function currentProgram(programs: EPGProgram[], now: number): EPGProgram | undefined {
  return programs.find((p) => {
    const s = p.startTime ? new Date(p.startTime).getTime() : 0;
    const e = p.endTime ? new Date(p.endTime).getTime() : 0;
    return s <= now && e > now;
  });
}

function progressPct(p: EPGProgram | undefined, now: number): number {
  if (!p?.startTime || !p?.endTime) return 0;
  const s = new Date(p.startTime).getTime();
  const e = new Date(p.endTime).getTime();
  if (e <= s) return 0;
  return Math.max(0, Math.min(100, ((now - s) / (e - s)) * 100));
}

export function EPGGrid({
  channels,
  renderedAt,
}: {
  channels: EPGChannel[];
  renderedAt: number;
}) {
  // Use the server-supplied timestamp for the initial render so SSR and
  // hydration produce identical markup. After mount we switch to the live
  // clock and tick every 30s.
  const [nowMs, setNowMs] = useState(renderedAt);

  useEffect(() => {
    setNowMs(Date.now());
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const startMs = snapTo30(nowMs - PAST_HOURS * 60 * 60_000);
  const endMs = startMs + (PAST_HOURS + FUTURE_HOURS) * 60 * 60_000;
  const totalMin = (endMs - startMs) / 60_000;
  const timelinePx = totalMin * PX_PER_MIN;

  const slots: number[] = [];
  for (let t = startMs; t < endMs; t += SLOT_MIN * 60_000) slots.push(t);

  const nowOffsetPx = ((nowMs - startMs) / 60_000) * PX_PER_MIN;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, nowOffsetPx - 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (channels.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-text-tertiary">
        No channels are live right now.
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="overflow-auto rounded-lg bg-[#0d0d0d] max-h-[calc(100vh-220px)]"
    >
      <div className="relative" style={{ width: `${CHANNEL_COL + timelinePx}px` }}>
        {/* Sticky time header */}
        <div
          className="sticky top-0 z-30 flex bg-[#0d0d0d]"
          style={{ height: `${HEADER_HEIGHT}px` }}
        >
          <div
            className="sticky left-0 z-10 bg-[#0d0d0d] flex items-center px-5 text-[11px] uppercase tracking-[0.25em] text-white/90 font-semibold shrink-0"
            style={{ width: `${CHANNEL_COL}px` }}
          >
            On now
          </div>

          <div className="relative" style={{ width: `${timelinePx}px` }}>
            {slots.map((s, i) => {
              const left = ((s - startMs) / 60_000) * PX_PER_MIN;
              return (
                <div
                  key={s}
                  className="absolute top-0 bottom-0 flex items-center text-[11px] uppercase tracking-[0.2em] text-white/70 font-medium"
                  style={{ left: `${left}px` }}
                >
                  <span className="mr-1 text-white/30">|</span>
                  {i === 0 ? 'ON NOW' : timeFmt.format(new Date(s))}
                </div>
              );
            })}

            {/* "Now" pill, sits at the current time on the header */}
            <div
              className="absolute top-1/2 -translate-y-1/2 z-10 pointer-events-none"
              style={{ left: `${nowOffsetPx}px` }}
            >
              <div className="relative -translate-x-1/2 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-black tabular-nums shadow">
                {timeFmt.format(new Date(nowMs))}
                <span className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Channel rows */}
        {channels.map((row) => {
          const id = row.channel?._id;
          if (!id) return null;
          const programs = row.programs ?? [];
          const hasSchedule = programs.length > 0;
          const onAir = currentProgram(programs, nowMs);
          const onAirPct = progressPct(onAir, nowMs);

          return (
            <div
              key={id}
              className="flex"
              style={{ height: `${ROW_HEIGHT}px` }}
            >
              {/* Sticky channel rail: heart, channel logo, on-air thumbnail */}
              <Link
                href={`/epg/${id}`}
                className="sticky left-0 z-20 bg-[#0d0d0d] flex items-stretch gap-2 pl-3 pr-2 py-2 shrink-0"
                style={{ width: `${CHANNEL_COL}px` }}
                aria-label={row.channel?.name || 'Channel'}
              >
                {/* Favourite */}
                <span className="self-center text-white/40 hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>

                {/* Channel logo card */}
                <div className="h-full aspect-square rounded-lg bg-black/60 flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                  {row.channel?.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.channel.logo}
                      alt=""
                      className="h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <span className="text-xl">📺</span>
                  )}
                </div>

                {/* On-air mini card */}
                <div className="relative h-full flex-1 rounded-lg overflow-hidden bg-[#181818] border border-white/5">
                  {onAir?.content?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={onAir.content.thumbnail}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/40">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  {onAir && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1.5 px-2">
                      <p className="text-[11px] font-semibold text-white line-clamp-1">
                        {onAir.content?.title || onAir.programName || onAir.title}
                      </p>
                    </div>
                  )}
                  {/* Progress bar — Prime's signature red fill at the bottom */}
                  {onAir && onAirPct > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${onAirPct}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>

              {/* Timeline strip */}
              <div className="relative py-2" style={{ width: `${timelinePx}px` }}>
                {hasSchedule ? (
                  programs.map((p, i) => {
                    const ps = p.startTime ? new Date(p.startTime).getTime() : 0;
                    const pe = p.endTime ? new Date(p.endTime).getTime() : 0;
                    if (!ps || !pe) return null;
                    if (pe <= startMs || ps >= endMs) return null;
                    const cs = Math.max(ps, startMs);
                    const ce = Math.min(pe, endMs);
                    const left = ((cs - startMs) / 60_000) * PX_PER_MIN;
                    const width = ((ce - cs) / 60_000) * PX_PER_MIN;
                    const isLive = ps <= nowMs && pe > nowMs;
                    return (
                      <Link
                        key={i}
                        href={`/epg/${id}`}
                        className={`absolute top-2 bottom-2 rounded-lg transition-colors flex flex-col justify-center px-4 overflow-hidden ${
                          isLive
                            ? 'bg-[#262626] hover:bg-[#2f2f2f] ring-1 ring-white/10'
                            : 'bg-[#181818] hover:bg-[#262626]'
                        }`}
                        style={{
                          left: `${left}px`,
                          width: `${Math.max(64, width - 6)}px`,
                        }}
                      >
                        <div className="font-semibold text-white line-clamp-2 text-[13px]">
                          {p.title}
                        </div>
                        {width > 200 && p.startTime && (
                          <div className="text-[10px] uppercase tracking-wider text-white/50 mt-0.5">
                            {timeFmt.format(new Date(p.startTime))}
                            {p.endTime && ' – ' + timeFmt.format(new Date(p.endTime))}
                          </div>
                        )}
                      </Link>
                    );
                  })
                ) : (
                  // No EPG schedule for this channel — render synthetic 2h
                  // "On Now" tiles across the visible window so the row isn't
                  // empty and the user can still click into the channel.
                  slots
                    .filter((_, i) => i % 4 === 0) // every 2 hours
                    .map((slotStart) => {
                      const blockEnd = slotStart + 2 * 60 * 60_000;
                      if (slotStart >= endMs) return null;
                      const cs = Math.max(slotStart, startMs);
                      const ce = Math.min(blockEnd, endMs);
                      const left = ((cs - startMs) / 60_000) * PX_PER_MIN;
                      const width = ((ce - cs) / 60_000) * PX_PER_MIN;
                      const isLive = slotStart <= nowMs && blockEnd > nowMs;
                      return (
                        <Link
                          key={slotStart}
                          href={`/epg/${id}`}
                          className={`absolute top-2 bottom-2 rounded-lg transition-colors flex flex-col justify-center px-4 overflow-hidden ${
                            isLive
                              ? 'bg-[#262626] hover:bg-[#2f2f2f] ring-1 ring-white/10'
                              : 'bg-[#181818] hover:bg-[#262626]'
                          }`}
                          style={{
                            left: `${left}px`,
                            width: `${Math.max(64, width - 6)}px`,
                          }}
                        >
                          <div className="font-semibold text-white text-[13px] line-clamp-1">
                            {row.channel?.name}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-white/50 mt-0.5">
                            {isLive ? 'On now · live loop' : '24/7 stream'}
                          </div>
                        </Link>
                      );
                    })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
