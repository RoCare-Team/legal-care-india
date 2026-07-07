import { Inbox } from 'lucide-react';

/**
 * RecentEnquiries — feed of recent client enquiries.
 * Enquiry tracking isn't wired up yet, so this shows an honest empty state
 * rather than placeholder data.
 */
export default function RecentEnquiries() {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Recent Enquiries</h2>
      <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink/15 py-10 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink/40">
          <Inbox className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink/70">No enquiries yet</p>
          <p className="mt-0.5 text-xs text-ink/45">
            Client calls, WhatsApp and email enquiries will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
