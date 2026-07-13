import { redirect } from 'next/navigation';
import { Inbox, Phone, Mail, Calendar } from 'lucide-react';
import { getSessionAdvocateId } from '@/lib/auth';
import { getEnquiriesForAdvocate } from '@/lib/enquiries';
import EnquiryStatusSelect from '@/components/dashboard/EnquiryStatusSelect';

export const metadata = {
  title: 'Enquiries | Legal Care India',
  robots: { index: false, follow: false },
};

/** A single client enquiry card. */
function EnquiryCard({ enquiry: e }) {
  const telHref = `tel:${e.phone.replace(/\s/g, '')}`;
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-ink">{e.name}</p>
          <p className="mt-0.5 text-[11px] text-ink/40">{e.date}</p>
        </div>
        <EnquiryStatusSelect id={e.id} initialStatus={e.status} />
      </div>

      <p className="mt-3 whitespace-pre-line text-sm text-ink/75">{e.message}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={telHref}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          {e.phone}
        </a>
        {e.email && (
          <a
            href={`mailto:${e.email}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/10"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {e.email}
          </a>
        )}
        {e.preferredDate && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink/70">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {e.preferredDate}
          </span>
        )}
      </div>
    </div>
  );
}

export default async function EnquiriesPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  const enquiries = await getEnquiriesForAdvocate(id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Enquiries</h1>
        <p className="mt-1 text-sm text-ink/55">
          Consultation requests sent to you from your public profile.
        </p>
      </div>

      {enquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/40">
            <Inbox className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink/70">No enquiries yet</p>
            <p className="mt-0.5 text-xs text-ink/45">
              When a client books a consultation from your profile, it will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((e) => (
            <EnquiryCard key={e.id} enquiry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
