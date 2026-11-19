'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ImagePlus, Loader2, MessageCircle, X } from 'lucide-react';

/** The campaign most sends from here are — the app announcement to lawyers. */
const DEFAULT_CAMPAIGN = 'app_updates_lawyer';

/**
 * Send a WhatsApp template campaign to the ticked lawyers.
 *
 * The image chosen here becomes the template's IMAGE header: it is uploaded
 * first (/api/admin/campaign-media), and the public link that comes back is
 * what WhatsApp fetches. Each lawyer is greeted by first name ({{1}}).
 *
 * @param {object} props
 * @param {string[]} props.ids
 * @param {() => void} props.onClose
 */
export default function WhatsAppCampaignModal({ ids, onClose }) {
  const [campaign, setCampaign] = useState(DEFAULT_CAMPAIGN);
  const [media, setMedia] = useState(null); // { url, filename, preview }
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const busy = uploading || sending;

  const upload = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/campaign-media', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not upload the image.');
        return;
      }
      setMedia({ url: data.url, filename: data.filename, preview: URL.createObjectURL(file) });
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const send = async () => {
    if (!window.confirm(`Send "${campaign}" on WhatsApp to ${ids.length} lawyer(s)?`)) return;
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          campaign: campaign.trim(),
          media: media ? { url: media.url, filename: media.filename } : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not send the campaign.');
        return;
      }
      setResult(data);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="WhatsApp campaign">
      <div className="absolute inset-0 bg-ink/60" onClick={() => !busy && onClose()} aria-hidden="true" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-ink/8 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink/45">WhatsApp campaign</p>
            <h2 className="mt-0.5 font-display text-[17px] font-bold text-ink">
              Send to {ids.length} lawyer{ids.length === 1 ? '' : 's'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {result ? (
            <div className="py-3 text-center">
              <span
                className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${
                  result.sent > 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                }`}
              >
                <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
              </span>
              <p className="mt-3 font-semibold text-ink">
                {result.sent > 0 ? `Sent to ${result.sent} number${result.sent === 1 ? '' : 's'}` : 'Nothing was sent'}
              </p>
              <p className="mt-1 text-sm text-ink/55">
                {result.sent > 0
                  ? `${result.selected - result.sent} skipped (no valid mobile number or a duplicate).`
                  : result.skipped}
              </p>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-medium text-ink">Campaign name</span>
                <input
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm outline-none focus:border-primary"
                />
                <span className="mt-1 block text-xs text-ink/45">
                  Exactly as in WhatsApp. {'{{1}}'} is filled with each lawyer&apos;s first name.
                </span>
              </label>

              <div>
                <span className="text-sm font-medium text-ink">Header image</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
                {media ? (
                  <div className="mt-1.5 overflow-hidden rounded-xl border border-ink/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.preview} alt="Campaign header" className="max-h-56 w-full bg-muted object-contain" />
                    <div className="flex items-center justify-between gap-2 border-t border-ink/8 px-3 py-2">
                      <span className="truncate text-xs text-ink/50">{media.url}</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => fileRef.current?.click()}
                        className="shrink-0 text-xs font-semibold text-primary hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileRef.current?.click()}
                    className="mt-1.5 flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-ink/15 px-4 py-7 text-ink/55 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    ) : (
                      <ImagePlus className="h-6 w-6" aria-hidden="true" />
                    )}
                    <span className="text-sm font-semibold">{uploading ? 'Uploading…' : 'Upload image'}</span>
                    <span className="text-xs text-ink/40">JPG or PNG, up to 5 MB</span>
                  </button>
                )}
                <span className="mt-1 block text-xs text-ink/45">
                  Leave empty for a template without an image header.
                </span>
              </div>
            </>
          )}

          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-ink/8 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-ink/5 disabled:opacity-40"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={send}
              disabled={busy || !campaign.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MessageCircle className="h-4 w-4" aria-hidden="true" />}
              Send on WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
