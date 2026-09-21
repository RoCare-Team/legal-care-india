import Link from 'next/link';
import { Mic, Video, PhoneCall, Download, ExternalLink } from 'lucide-react';
import { adminGetRecordedCalls } from '@/lib/admin';
import { AdminPageHeader } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import { formatDate } from '@/utils/formatters';

export const metadata = { title: 'Call recordings', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

/** "2.4 MB" from a byte count. */
function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Admin → Call recordings. Every audio and video call that ran, with the
 * recording(s) of it playable in place. A call with nothing recorded says so.
 */
export default async function AdminRecordingsPage({ searchParams }) {
  const requested = Number.parseInt((await searchParams)?.page, 10);
  const data = await adminGetRecordedCalls({
    page: Number.isNaN(requested) ? 1 : Math.max(requested, 1),
    perPage: PER_PAGE,
  });

  return (
    <div>
      <AdminPageHeader
        title="Call Recordings"
        subtitle="Every audio and video call, with its recording. Web calls are recorded with both voices; phone-app calls are saved per device, one file for each side."
        count={data.total}
      />

      {data.rows.length === 0 ? (
        <p className="rounded-2xl border border-ink/8 bg-surface px-5 py-14 text-center text-sm text-ink/50 shadow-card">
          No audio or video calls have taken place yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {data.rows.map((c) => {
            const Icon = c.type === 'video' ? Video : PhoneCall;
            return (
              <li key={c.id} className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-ink">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      {c.userName} <span className="text-ink/30">↔</span> {c.advocateName}
                    </p>
                    <p className="mt-1 text-xs text-ink/50">
                      {c.type === 'video' ? 'Video' : 'Audio'} call · {formatDate(c.startedAt || c.createdAt)}
                      {c.minutes > 0 && <> · {c.minutes} min</>}
                      {c.price > 0 && <> · ₹{c.price.toLocaleString('en-IN')}</>}
                    </p>
                  </div>
                  <Link
                    href={`/admin/consultations/${c.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    Session <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>

                {c.recordings.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-700">
                    No recording for this call
                    {c.call.connected
                      ? ' — it connected, but the recording did not upload (browser without recording support, or the tab closed before it finished).'
                      : ' — the call never connected.'}
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {c.recordings.map((rec) => {
                      const src = `/api/consultations/${c.id}/recording?callId=${encodeURIComponent(rec.callId)}`;
                      return (
                        <div key={rec.callId} className="rounded-xl border border-ink/8 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
                              <Mic className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                              {rec.label}
                            </span>
                            <span className="text-xs text-ink/40">{formatBytes(rec.size)}</span>
                          </div>
                          <audio controls preload="none" className="w-full" src={src} />
                          <a
                            href={src}
                            download
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        basePath="/admin/recordings"
        total={data.total}
        perPage={PER_PAGE}
      />
    </div>
  );
}
