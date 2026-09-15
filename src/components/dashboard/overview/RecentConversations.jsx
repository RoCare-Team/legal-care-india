import Link from 'next/link';
import { MessagesSquare, PhoneCall, Video, PhoneMissed } from 'lucide-react';
import ViewConversationButton from '@/components/consultation/ViewConversationButton';
import { istRelativeLabel, latestPerClient } from '@/lib/dashboardOverview';

const TYPE_ICON = { chat: MessagesSquare, audio: PhoneCall, video: Video };
const TYPE_NAME = { chat: 'Chat', audio: 'Call', video: 'Video call' };

/** One line of preview: their last message, else what the session came to. */
function preview(c) {
  if (c.lastMessage?.text) {
    return { text: `${c.lastMessage.from === 'advocate' ? 'You: ' : ''}${c.lastMessage.text}` };
  }
  const name = TYPE_NAME[c.type] || 'Chat';
  if (c.status === 'ended' && c.talkedMinutes > 0) {
    return { icon: TYPE_ICON[c.type], text: `${name} ended • ${c.talkedMinutes} mins` };
  }
  if (c.status === 'active') return { icon: TYPE_ICON[c.type], text: `${name} in progress` };
  if (c.status === 'rejected') return { icon: PhoneMissed, text: 'You declined this request' };
  if (c.status === 'cancelled') return { icon: PhoneMissed, text: 'Client cancelled the request' };
  return { icon: PhoneMissed, text: `Missed ${name.toLowerCase()} request` };
}

/**
 * Recent Conversations — the latest session with each client.
 *
 * @param {object} props
 * @param {Array} props.consultations  visible history rows, newest first
 */
export default function RecentConversations({ consultations }) {
  const rows = latestPerClient(consultations, 5);

  return (
    <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Recent Conversations</h2>
        {rows.length > 0 && (
          <Link href="/dashboard/consultations" className="text-sm font-medium text-primary hover:underline">
            See All
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink/15 py-8 text-center">
          <MessagesSquare className="h-6 w-6 text-ink/30" aria-hidden="true" />
          <p className="text-sm font-medium text-ink/65">No conversations yet</p>
          <p className="px-6 text-xs text-ink/45">Chats and calls with clients will be listed here.</p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-ink/8">
          {rows.map((c) => {
            const p = preview(c);
            const Icon = p.icon;
            const initial = String(c.userName || 'C').charAt(0).toUpperCase();
            return (
              <li key={c.id} className="flex items-start gap-3 py-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-base font-semibold text-primary" aria-hidden="true">
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-semibold text-ink">{c.userName}</p>
                    <span className="shrink-0 text-xs text-ink/45">
                      {istRelativeLabel(c.lastMessage?.at || c.startedAt || c.createdAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-1.5 text-sm text-ink/55">
                      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                      <span className="truncate">{p.text}</span>
                    </p>
                    {c.messagesCount > 0 && (
                      <span className="-my-1 -mr-2 shrink-0">
                        <ViewConversationButton id={c.id} otherName={c.userName} viewerRole="advocate" />
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
