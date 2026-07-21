import Link from 'next/link';
import { Inbox, Phone, Mail, Calendar } from 'lucide-react';
import EnquiryStatusSelect from './EnquiryStatusSelect';

/**
 * RecentEnquiries — feed of recent client consultation requests submitted via
 * the "Book Consultation" form on the lawyer's public profile.
 *
 * @param {object} props
 * @param {Array} [props.enquiries]  serialized enquiries, newest first
 */
export default function RecentEnquiries({ enquiries = [] }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Recent Enquiries</h2>
        {enquiries.length > 0 && (
          <Link href="/dashboard/enquiries" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        )}
      </div>

      {enquiries.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink/15 py-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink/40">
            <Inbox className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink/70">No enquiries yet</p>
            <p className="mt-0.5 text-xs text-ink/45">
              Consultation requests from your profile will appear here.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {enquiries.slice(0, 4).map((e) => (
            <li key={e.id} className="rounded-xl border border-ink/8 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{e.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/55">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" aria-hidden="true" />
                      {e.phone}
                    </span>
                    {e.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" aria-hidden="true" />
                        {e.email}
                      </span>
                    )}
                    {e.preferredDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {e.preferredDate}
                      </span>
                    )}
                  </p>
                </div>
                <EnquiryStatusSelect id={e.id} initialStatus={e.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-ink/70">{e.message}</p>
              <p className="mt-1.5 text-[11px] text-ink/40">{e.date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
