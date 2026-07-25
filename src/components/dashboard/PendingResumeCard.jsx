'use client';

import { useState } from 'react';
import { RotateCcw, Clock, MessagesSquare, PhoneCall, Video, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui';

/** "8 min 30 sec" / "8 min" / "45 sec" from a whole-second count. */
function formatLeftover(sec = 0) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m && s) return `${m} min ${s} sec`;
  if (m) return `${m} min`;
  return `${s} sec`;
}

/** Rough "expires in Xh Ym" from an ISO timestamp (rendered at page load). */
function expiresIn(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expiring now';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours) return `expires in ${hours}h ${mins}m`;
  return `expires in ${mins}m`;
}

/** The three channels a consultation can be held on, in the order shown. */
const CHANNELS = [
  { key: 'chat', label: 'Live Chat', icon: MessagesSquare },
  { key: 'audio', label: 'Audio Call', icon: PhoneCall },
  { key: 'video', label: 'Video Call', icon: Video },
];

/**
 * PendingResumeCard — clients holding unused, paid time with this lawyer that
 * they can reconnect for free within 24 hours.
 *
 * Split by channel, because "13 min left" means three different things to a
 * lawyer depending on whether it comes back as a chat window, a ringing phone
 * or a video call — and one flat list of names told them none of that. Each
 * tile opens its own list, where the row finally says what was booked against
 * what is still owed.
 *
 * @param {object} props
 * @param {Array} props.items  resumable consultation rows (leftover > 0)
 */
export default function PendingResumeCard({ items = [] }) {
  const groups = CHANNELS.map((c) => ({
    ...c,
    rows: items.filter((i) => (i.type || 'chat') === c.key),
  }));

  // Open the busiest channel first — that is the one they most likely came to
  // look at, and it means the panel is never sitting there empty.
  const busiest = [...groups].sort((a, b) => b.rows.length - a.rows.length)[0];
  const [openKey, setOpenKey] = useState(busiest?.rows.length ? busiest.key : null);

  if (items.length === 0) return null;

  const openGroup = groups.find((g) => g.key === openKey);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-accent/[0.05] shadow-card">
      {/* Header and the three tiles share one row on desktop — the heading is a
          label, not a paragraph, so it shouldn't cost the card a whole band. */}
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 lg:w-52 lg:shrink-0">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/20 text-primary-dark">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold leading-tight text-ink">
              Leftover time to resume
            </h2>
            <p className="text-[11px] leading-tight text-ink/50">
              Free for these clients for 24h — already paid.
            </p>
          </div>
        </div>

        <div className="grid flex-1 gap-2 sm:grid-cols-3">
          {groups.map(({ key, label, icon: Icon, rows }) => {
            const total = rows.reduce((sum, r) => sum + (r.resumeLeftoverSeconds || 0), 0);
            const isOpen = openKey === key;
            const empty = rows.length === 0;

            return (
              <button
                key={key}
                type="button"
                disabled={empty}
                onClick={() => setOpenKey(isOpen ? null : key)}
                aria-expanded={isOpen}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  empty
                    ? 'cursor-default border-ink/8 bg-surface/50 opacity-55'
                    : isOpen
                      ? 'border-primary bg-surface shadow-sm ring-1 ring-primary/20'
                      : 'border-ink/10 bg-surface hover:border-primary/40'
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    empty ? 'bg-ink/5 text-ink/35' : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[11px] font-medium text-ink/50">{label}</span>
                  <span className="block text-sm font-semibold text-ink">
                    {rows.length}
                    <span className="ml-1 text-[11px] font-medium text-ink/40">
                      {rows.length === 1 ? 'client' : 'clients'}
                    </span>
                    {!empty && (
                      <span className="ml-1.5 text-[11px] font-medium text-primary">
                        · {formatLeftover(total)}
                      </span>
                    )}
                  </span>
                </span>

                {!empty && (
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 text-ink/25 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* The open channel's clients: what they booked against what is left.
          Scrolls past four or so, rather than pushing the page down. */}
      {openGroup && openGroup.rows.length > 0 && (
        <ul className="max-h-56 space-y-px overflow-y-auto border-t border-ink/8 bg-surface/70 px-2 py-2">
          {openGroup.rows.map((c) => (
            <li key={c.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-ink/[0.03]">
              <Avatar name={c.userName} size="sm" />

              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium text-ink">{c.userName}</p>
                <p className="mt-0.5 text-[11px] text-ink/45">
                  Booked {Math.round(c.minutes)} min
                  {c.price > 0 && ` · ₹${Number(c.price).toLocaleString('en-IN')}`}
                  <span className="text-ink/25"> · </span>
                  {expiresIn(c.resumeExpiresAt)}
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/[0.07] px-2.5 py-1 text-[11px] font-semibold text-primary">
                <Clock className="h-3 w-3 text-accent" aria-hidden="true" />
                {formatLeftover(c.resumeLeftoverSeconds)} left
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
