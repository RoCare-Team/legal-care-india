'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, FileText, Badge, Loader2, CheckCircle2, ExternalLink, RotateCw } from 'lucide-react';
import DashboardSection from '../DashboardSection';

/**
 * SectionVerificationDocuments — Bar Council certificate and government ID,
 * uploaded here the same way the mobile app's onboarding collects them.
 *
 * These are not part of the profile draft the rest of this form edits: each
 * upload is sent and saved the moment it is picked, straight to
 * /api/dashboard/verification-documents — the same endpoint the app uses — so
 * a lawyer never loses a document by navigating away before pressing the
 * form's own "Save". Uploading a kind again replaces the earlier file, which
 * is why the button reads "Replace" once one is on file.
 *
 * The files themselves are never shown or downloaded from here in the clear —
 * "View" opens the per-document route, which streams the bytes back only to
 * the lawyer who uploaded them.
 */
const KINDS = [
  {
    kind: 'bar_council_certificate',
    title: 'Bar Council Certificate',
    icon: Badge,
  },
  {
    kind: 'government_id',
    title: 'Government ID Proof',
    icon: FileText,
  },
];

export default function SectionVerificationDocuments() {
  const [docs, setDocs] = useState(null); // null = loading; {} once read
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard/verification-documents')
      .then((res) => res.json())
      .then((payload) => {
        if (cancelled) return;
        const byKind = {};
        for (const d of payload?.documents || []) byKind[d.kind] = d;
        setDocs(byKind);
      })
      .catch(() => {
        if (!cancelled) setDocs({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const upload = async (kind, file) => {
    if (!file) return;
    setUploading(kind);
    setError('');
    try {
      const form = new FormData();
      form.append('kind', kind);
      form.append('file', file);
      const res = await fetch('/api/dashboard/verification-documents', { method: 'POST', body: form });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not upload that file. Please try again.');
        return;
      }
      setDocs((prev) => ({ ...prev, [kind]: payload.document }));
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setUploading('');
    }
  };

  return (
    <DashboardSection
      id="verification"
      title="Verification Documents"
      description="Your Bar Council certificate and a government ID, so our team can verify you. Kept private — only you and our review team can see them."
      icon={ShieldCheck}
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {KINDS.map(({ kind, title, icon: Icon }) => {
          const doc = docs?.[kind];
          const busy = uploading === kind;
          return (
            <div key={kind} className="rounded-xl border border-ink/10 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/[0.07] text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-xs text-ink/50">PDF, JPG or PNG · max 5MB</p>

                  {doc ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{doc.fileName || 'Uploaded'}</span>
                    </p>
                  ) : docs === null ? (
                    <p className="mt-2 text-[12.5px] text-ink/40">Checking…</p>
                  ) : (
                    <p className="mt-2 text-[12.5px] text-ink/45">Not uploaded yet.</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    doc
                      ? 'border border-ink/15 text-ink/70 hover:border-primary/40 hover:text-primary'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  } ${busy ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : doc ? (
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : null}
                  {busy ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      upload(kind, file);
                      e.target.value = '';
                    }}
                  />
                </label>

                {doc && (
                  <a
                    href={`/api/dashboard/verification-documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-ink/55 hover:text-primary"
                  >
                    View
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-[12px] leading-relaxed text-ink/45">
        Reviewed along with the rest of your profile, usually within 24–48 hours. Uploading again replaces the earlier file.
      </p>
    </DashboardSection>
  );
}
