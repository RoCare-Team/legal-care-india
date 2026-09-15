import { redirect } from 'next/navigation';
import { MessageCircleMore, MessagesSquare, PhoneCall, Video, Users, IndianRupee } from 'lucide-react';
import ViewConversationButton from '@/components/consultation/ViewConversationButton';
import PortalAvatar from '@/components/dashboard/portal/PortalAvatar';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateConsultations } from '@/lib/consultations';
import { clientThreads, istRelativeLabel } from '@/lib/dashboardOverview';

export const metadata = {
  title: 'Messages | Lawyer Portal',
  robots: { index: false, follow: false },
};

const TYPE_ICON = { chat: MessagesSquare, audio: PhoneCall, video: Video };
const TYPE_LABEL = { chat: 'Chat', audio: 'Audio', video: 'Video' };

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

function Stat({ icon: Icon, value, label, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-xl font-semibold text-ink">{value}</p>
        <p className="text-xs leading-tight text-ink/55">{label}</p>
      </div>
    </div>
  );
}

/**
 * Messages — every client the lawyer has spoken to, one row each: their last
 * line, how many sessions and messages, and what the relationship has earned.
 * The full transcript opens read-only; new messages happen in a live session.
 */
export default async function MessagesPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  const all = await getAdvocateConsultations(id);
  const threads = clientThreads(all.filter((c) => !c.hidden));
  const totalMessages = threads.reduce((sum, t) => sum + t.messages, 0);
  const withChats = threads.filter((t) => t.messages > 0).length;
  const earned = threads.reduce((sum, t) => sum + t.earned, 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Messages</h1>
        <p className="mt-1 text-sm text-ink/55">
          Everyone who has chatted or called you — open a conversation to read it in full.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat icon={Users} value={threads.length} label="Clients" tone="bg-primary/10 text-primary" />
        <Stat icon={MessageCircleMore} value={withChats} label="Conversations" tone="bg-blue-500/10 text-blue-600" />
        <Stat icon={MessagesSquare} value={totalMessages} label="Messages exchanged" tone="bg-violet-50 text-violet-600" />
        <Stat icon={IndianRupee} value={money(earned)} label="Earned from these clients" tone="bg-emerald-50 text-emerald-600" />
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-surface py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/40">
            <MessageCircleMore className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink/70">No conversations yet</p>
            <p className="mt-0.5 px-6 text-xs text-ink/45">
              Stay online — when a client chats or calls you, they will be listed here.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-ink/8 overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card">
          {threads.map((t) => {
            const when = t.lastMessage?.at || t.latest.startedAt || t.latest.createdAt;
            const preview = t.lastMessage
              ? `${t.lastMessage.from === 'advocate' ? 'You: ' : ''}${t.lastMessage.text}`
              : t.earned > 0 || t.minutes > 0
                ? `${t.types.every((x) => x === 'chat') ? 'Chat session' : 'Call'} — no chat messages`
                : 'No messages yet';
            const live = t.latest.status === 'active';
            return (
              <li key={t.userId} className="flex items-start gap-3.5 px-4 py-4 transition-colors hover:bg-ink/[0.02] sm:px-5">
                <span className="relative">
                  <PortalAvatar name={t.userName} size={48} />
                  {live && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-semibold text-ink">
                      {t.userName}
                      {live && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 align-middle text-[11px] font-semibold text-emerald-700">
                          Live now
                        </span>
                      )}
                    </p>
                    <span className="shrink-0 text-xs text-ink/45">{istRelativeLabel(when)}</span>
                  </div>

                  <p className={`mt-0.5 truncate text-sm ${t.lastMessage ? 'text-ink/65' : 'italic text-ink/40'}`}>
                    {preview}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink/50">
                    <span className="flex items-center gap-1.5">
                      {t.types.map((type) => {
                        const Icon = TYPE_ICON[type] || MessagesSquare;
                        return (
                          <span
                            key={type}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/[0.06] px-2 py-0.5 font-medium text-primary"
                          >
                            <Icon className="h-3 w-3" aria-hidden="true" />
                            {TYPE_LABEL[type]}
                          </span>
                        );
                      })}
                    </span>
                    <span>
                      {t.sessions} {t.sessions === 1 ? 'session' : 'sessions'}
                    </span>
                    {t.messages > 0 && (
                      <span>
                        {t.messages} {t.messages === 1 ? 'message' : 'messages'}
                      </span>
                    )}
                    {t.earned > 0 && <span className="font-semibold text-emerald-600">{money(t.earned)} earned</span>}
                  </div>

                  {/* Phones: under the details, so the name keeps the row's width. */}
                  {t.threadId && (
                    <span className="-ml-2.5 mt-1.5 block sm:hidden">
                      <ViewConversationButton id={t.threadId} otherName={t.userName} viewerRole="advocate" />
                    </span>
                  )}
                </div>

                {t.threadId && (
                  <span className="hidden shrink-0 self-center sm:block">
                    <ViewConversationButton id={t.threadId} otherName={t.userName} viewerRole="advocate" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
