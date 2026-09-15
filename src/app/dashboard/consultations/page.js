import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  MessagesSquare, Clock, CalendarCheck, MessageCircle, Wallet, PhoneCall, Video, Users,
} from 'lucide-react';
import RemoveConsultationButton from '@/components/dashboard/RemoveConsultationButton';
import ViewConversationButton from '@/components/consultation/ViewConversationButton';
import PortalAvatar from '@/components/dashboard/portal/PortalAvatar';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateConsultations } from '@/lib/consultations';
import { istDateTime } from '@/lib/dashboardOverview';
import { formatRate } from '@/constants/callRates';
import { formatMoney, COMMISSION_LABEL } from '@/constants/payouts';

export const metadata = {
  title: 'Consultations | Lawyer Portal',
  robots: { index: false, follow: false },
};

/** Presentation for each consultation status (lawyer's point of view). */
const STATUS_META = {
  ended: { label: 'Completed', tone: 'bg-emerald-500/10 text-emerald-700' },
  active: { label: 'Ongoing', tone: 'bg-blue-500/10 text-blue-700' },
  pending: { label: 'Missed', tone: 'bg-amber-500/10 text-amber-700' },
  rejected: { label: 'You declined', tone: 'bg-red-500/10 text-red-600' },
  cancelled: { label: 'Client cancelled', tone: 'bg-ink/10 text-ink/50' },
};

const TYPE_META = {
  chat: { label: 'Chat', icon: MessagesSquare },
  audio: { label: 'Audio call', icon: PhoneCall },
  video: { label: 'Video call', icon: Video },
};

/** The filter tabs, each a status set; `all` matches everything. */
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed', statuses: ['ended', 'active'] },
  { key: 'missed', label: 'Missed', statuses: ['pending'] },
  { key: 'declined', label: 'Declined', statuses: ['rejected'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
];

const money = formatMoney;

function ConsultationCard({ item: c }) {
  const meta = STATUS_META[c.status] || STATUS_META.cancelled;
  const type = TYPE_META[c.type] || TYPE_META.chat;
  const TypeIcon = type.icon;
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3">
        <PortalAvatar name={c.userName} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-base font-semibold text-ink">{c.userName}</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
              {meta.label}
            </span>
            {c.isResume && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
                Resumed · Free
              </span>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink/50">
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {type.label}
            </span>
            <span className="text-ink/25">•</span>
            {istDateTime(c.startedAt || c.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={`text-sm font-semibold ${c.isResume ? 'text-ink/50' : c.charged ? 'text-emerald-600' : 'text-ink/35'}`}>
            {c.isResume ? 'Free' : c.charged ? `+${money(c.earning)}` : '—'}
          </span>
          {c.messagesCount > 0 && (
            <ViewConversationButton id={c.id} otherName={c.userName} viewerRole="advocate" />
          )}
          {c.status !== 'active' && <RemoveConsultationButton id={c.id} name={c.userName} />}
        </div>
      </div>

      {(c.charged || c.rate > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink/8 pt-3 text-xs text-ink/60">
          {c.rate > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
              {formatRate(c.rate)}
            </span>
          )}
          {c.charged && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
                Talked {c.talkedMinutes} min · billed {Math.round(c.minutes)} min
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
                Client paid {money(c.price)} · JusticeLand {COMMISSION_LABEL} −{money(c.commission)}
              </span>
              {c.messagesCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
                  {c.messagesCount} {c.messagesCount === 1 ? 'message' : 'messages'}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryTile({ icon: Icon, value, label, tone }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}

export default async function ConsultationsPage({ searchParams }) {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  // Rows the lawyer cleared drop out of the list and the totals alike.
  const all = await getAdvocateConsultations(id);
  const consultations = all.filter((c) => !c.hidden);
  const connected = consultations.filter((c) => c.charged);
  const earned = connected.reduce((sum, c) => sum + c.earning, 0);
  const minutes = connected.reduce((sum, c) => sum + c.talkedMinutes, 0);
  const clients = new Set(consultations.map((c) => c.userId)).size;

  const params = await searchParams;
  const tab = TABS.find((t) => t.key === params?.status) || TABS[0];
  const shown = tab.statuses ? consultations.filter((c) => tab.statuses.includes(c.status)) : consultations;
  const countFor = (t) =>
    t.statuses ? consultations.filter((c) => t.statuses.includes(c.status)).length : consultations.length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Consultations</h1>
        <p className="mt-1 text-sm text-ink/55">
          Every chat, audio and video request you received — who it was, how long you talked and what you earned.
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-surface py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/40">
            <MessagesSquare className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink/70">No consultations yet</p>
            <p className="mt-0.5 px-6 text-xs text-ink/45">
              Set your rates in Edit Profile and stay online — requests will show up here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <SummaryTile icon={Wallet} value={money(earned)} label="Your earnings (after commission)" tone="bg-emerald-500/10 text-emerald-600" />
            <SummaryTile icon={MessagesSquare} value={connected.length} label="Paid consultations" tone="bg-primary/10 text-primary" />
            <SummaryTile icon={Users} value={clients} label="Clients" tone="bg-violet-50 text-violet-600" />
            <SummaryTile icon={Clock} value={minutes} label="Minutes talked" tone="bg-blue-500/10 text-blue-600" />
          </div>

          <nav aria-label="Filter consultations" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {TABS.map((t) => {
              const active = t.key === tab.key;
              return (
                <Link
                  key={t.key}
                  href={t.key === 'all' ? '/dashboard/consultations' : `/dashboard/consultations?status=${t.key}`}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-primary-dark bg-primary-dark text-white'
                      : 'border-ink/10 bg-surface text-ink/65 hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {t.label}
                  <span className={`text-xs ${active ? 'text-white/70' : 'text-ink/40'}`}>{countFor(t)}</span>
                </Link>
              );
            })}
          </nav>

          {shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/15 bg-surface px-4 py-10 text-center text-sm text-ink/50">
              Nothing under “{tab.label}”.
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {shown.map((c) => (
                <ConsultationCard key={c.id} item={c} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
