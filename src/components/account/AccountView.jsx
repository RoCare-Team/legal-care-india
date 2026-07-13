'use client';

import { useMemo, useState } from 'react';
import {
  Mail, Phone, MapPin, LogOut, Search, CalendarCheck, MessageCircle,
  ArrowUpRight, Inbox, UserRound, LayoutDashboard, Users, Clock,
} from 'lucide-react';
import { Avatar, Button } from '@/components/ui';
import { logout } from '@/utils/logout';
import { USER_STATUS_META } from '@/constants/enquiryStatus';

/** Per-activity-type presentation: icon, label and accent colour. */
const ACTIVITY_META = {
  booking: { icon: CalendarCheck, label: 'Booked consultation', short: 'Booked', tone: 'text-primary bg-primary/10' },
  call: { icon: Phone, label: 'Called', short: 'Called', tone: 'text-emerald-600 bg-emerald-500/10' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', short: 'WhatsApp', tone: 'text-emerald-600 bg-emerald-500/10' },
  email: { icon: Mail, label: 'Emailed', short: 'Email', tone: 'text-blue-600 bg-blue-500/10' },
};

const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'advocates', label: 'My Advocates', icon: Users },
  { key: 'profile', label: 'Profile', icon: UserRound },
];

/** Group a flat activity feed into one entry per advocate, with type counts. */
function groupByAdvocate(activity) {
  const map = new Map();
  for (const a of activity) {
    const key = a.advocateProfilePath || a.advocateName;
    if (!map.has(key)) {
      map.set(key, {
        key,
        advocateId: a.advocateId,
        name: a.advocateName,
        city: a.advocateCity,
        phone: a.advocatePhone,
        profilePath: a.advocateProfilePath,
        interactions: [],
        counts: {},
      });
    }
    const g = map.get(key);
    g.interactions.push(a);
    g.counts[a.type] = (g.counts[a.type] || 0) + 1;
  }
  // Activity arrives newest-first, so the first item per advocate is the latest.
  return Array.from(map.values()).map((g) => ({ ...g, latest: g.interactions[0] }));
}

/**
 * AccountView — the logged-in client's account dashboard. A fixed left sidebar
 * (Overview / My Advocates / Profile) drives the main content on the right, so
 * it scales cleanly no matter how many advocates the user has contacted.
 *
 * @param {object} props
 * @param {{ name: string, email: string, phone?: string, city?: string, photo?: string }} props.user
 * @param {Array} [props.activity]  the user's advocate interactions, newest first
 */
export default function AccountView({ user, activity = [], bookingStatus = {} }) {
  const groups = useMemo(() => groupByAdvocate(activity), [activity]);
  const [view, setView] = useState('overview');

  const bookings = activity.filter((a) => a.type === 'booking').length;

  return (
    <div className="w-full border-b border-ink/8 bg-surface">
      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)]">
        {/* ── Fixed sidebar ─────────────────────────────────────────────── */}
        <aside className="flex flex-col border-b border-ink/8 bg-ink/[0.025] md:border-b-0 md:border-r">
          {/* Profile header */}
          <div className="flex items-center gap-3 border-b border-ink/8 p-5">
            <Avatar src={user.photo} name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink/50">{user.email}</p>
            </div>
          </div>

          {/* Fixed nav */}
          <nav className="flex-1 p-3">
            <ul className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = view === item.key;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setView(item.key)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? 'bg-primary/10 text-primary' : 'text-ink/65 hover:bg-ink/5 hover:text-ink'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                      {item.key === 'advocates' && groups.length > 0 && (
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          active ? 'bg-primary/15 text-primary' : 'bg-ink/10 text-ink/50'
                        }`}>
                          {groups.length}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer actions */}
          <div className="mt-auto space-y-2 border-t border-ink/8 p-4">
            <Button href="/advocates" size="sm" fullWidth leftIcon={<Search className="h-4 w-4" />}>
              Find Advocates
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => logout('/')}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Log out
            </Button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="min-h-[28rem] p-6 sm:p-8">
          {view === 'overview' && (
            <OverviewView
              user={user}
              activity={activity}
              advocateCount={groups.length}
              bookings={bookings}
              onSeeAdvocates={() => setView('advocates')}
            />
          )}
          {view === 'advocates' && <AdvocatesView groups={groups} bookingStatus={bookingStatus} />}
          {view === 'profile' && <ProfileView user={user} />}
        </main>
      </div>
    </div>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────── */

function OverviewView({ user, activity, advocateCount, bookings, onSeeAdvocates }) {
  const firstName = user.name.split(' ')[0];
  const recent = activity.slice(0, 6);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink">Hi, {firstName} 👋</h2>
      <p className="mt-1 text-sm text-ink/55">Here&apos;s a summary of your activity.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} value={advocateCount} label="Advocates contacted" tone="text-primary bg-primary/10" />
        <StatCard icon={CalendarCheck} value={bookings} label="Consultations booked" tone="text-emerald-600 bg-emerald-500/10" />
        <StatCard icon={Clock} value={activity.length} label="Total interactions" tone="text-blue-600 bg-blue-500/10" />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">Recent activity</h3>
        {advocateCount > 0 && (
          <button type="button" onClick={onSeeAdvocates} className="text-xs font-medium text-primary hover:underline">
            View advocates
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <EmptyActivity />
      ) : (
        <ul className="mt-3 space-y-2.5">
          {recent.map((a) => {
            const meta = ACTIVITY_META[a.type] || ACTIVITY_META.call;
            const Icon = meta.icon;
            return (
              <li key={a.id} className="flex items-center gap-3 rounded-xl border border-ink/8 p-3.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${meta.tone}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    <span className="font-medium">{meta.label}</span>
                    <span className="text-ink/50"> · {a.advocateName}</span>
                  </p>
                  <p className="text-xs text-ink/45">{a.date}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, tone }) {
  return (
    <div className="rounded-2xl border border-ink/8 p-4">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}

/* ── My Advocates (scales to any number) ──────────────────────────────── */

function AdvocatesView({ groups, bookingStatus = {} }) {
  if (groups.length === 0) return <EmptyActivity />;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink">My Advocates</h2>
      <p className="mt-1 text-sm text-ink/55">
        Advocates you&apos;ve booked, called or contacted.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {groups.map((g) => {
          // If the user booked a consultation, surface the advocate's response.
          const booked = Boolean(g.counts.booking);
          const statusMeta = booked
            ? USER_STATUS_META[bookingStatus[g.advocateId] || 'new']
            : null;
          // Non-booking interactions (booking has its own status row).
          const otherTypes = Object.entries(g.counts).filter(([t]) => t !== 'booking');
          return (
          <div key={g.key} className="rounded-2xl border border-ink/8 p-4 shadow-card">
            <div className="flex items-start gap-3">
              <Avatar name={g.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold text-ink">{g.name}</p>
                {g.city && (
                  <p className="flex items-center gap-1 text-xs text-ink/55">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {g.city}
                  </p>
                )}
              </div>
              {g.profilePath && (
                <a
                  href={`/advocates/${g.profilePath}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/45 transition-colors hover:bg-ink/5 hover:text-primary"
                  aria-label={`View ${g.name}'s profile`}
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>

            {/* Interaction summary badges — 'booking' has its own status row below */}
            {otherTypes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {otherTypes.map(([type, count]) => {
                  const meta = ACTIVITY_META[type] || ACTIVITY_META.call;
                  const Icon = meta.icon;
                  return (
                    <span
                      key={type}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}
                    >
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {meta.short}
                      {count > 1 ? ` ×${count}` : ''}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Booking response status (only when they booked a consultation) */}
            {statusMeta && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink/[0.03] px-3 py-2">
                <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-ink/40" aria-hidden="true" />
                <span className="text-xs text-ink/55">Appointment:</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusMeta.tone}`}>
                  {statusMeta.label}
                </span>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-ink/8 pt-3">
              {g.phone ? (
                <a
                  href={`tel:${g.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  {g.phone}
                </a>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-ink/40">Last: {g.latest.date}</span>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Profile ──────────────────────────────────────────────────────────── */

function ProfileView({ user }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar src={user.photo} name={user.name} size="lg" />
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold text-ink">{user.name}</h2>
          <p className="text-sm text-ink/55">Your Legal Care India account</p>
        </div>
      </div>

      <dl className="mt-7 max-w-md divide-y divide-ink/8 border-t border-ink/8">
        <DetailRow icon={UserRound} label="Name" value={user.name} />
        <DetailRow icon={Mail} label="Email" value={user.email} />
        <DetailRow icon={Phone} label="Mobile" value={user.phone} />
        <DetailRow icon={MapPin} label="City" value={user.city} />
      </dl>

      <div className="mt-7 flex flex-wrap gap-2">
        <Button href="/advocates" leftIcon={<Search className="h-4 w-4" />}>
          Find Advocates
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => logout('/')}
          leftIcon={<LogOut className="h-4 w-4" />}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <dt className="w-20 shrink-0 text-sm text-ink/50">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium text-ink/80">{value || '—'}</dd>
    </div>
  );
}

function EmptyActivity() {
  return (
    <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/40">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium text-ink/70">No activity yet</p>
        <p className="mt-0.5 text-xs text-ink/45">
          When you book or contact an advocate, it will show up here.
        </p>
      </div>
      <Button href="/advocates" size="sm" className="mt-1" leftIcon={<Search className="h-4 w-4" />}>
        Find Advocates
      </Button>
    </div>
  );
}
