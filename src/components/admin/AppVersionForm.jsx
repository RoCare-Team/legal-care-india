'use client';

import { useState } from 'react';
import { Loader2, Check, CircleAlert, Smartphone, ShieldAlert } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

const LABEL = { android: 'Android', ios: 'iOS' };

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink/60">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-[11.5px] text-ink/45">{hint}</span>}
    </label>
  );
}

const input =
  'h-10 w-full rounded-lg border border-ink/12 bg-white px-3 text-[13px] text-ink outline-none focus:border-primary';

/**
 * AppVersionForm — one platform's store version and force-update switch.
 *
 * Force update is on whenever "Minimum supported build" is above 0: every
 * installed build below it gets a screen it cannot dismiss. The warning above
 * the Save button says so in words, with the number, before anyone saves it.
 */
export default function AppVersionForm({ initial }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    setSaved(false);
  };

  const latest = Number(v.latestBuild) || 0;
  const min = Number(v.minSupportedBuild) || 0;
  const forceOn = min > 0;

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/app-version', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, latestBuild: latest, minSupportedBuild: min }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save.');
      setV(data.settings);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" /> {LABEL[v.platform]}
        </h2>
        <span
          className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
            forceOn ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-700'
          }`}
        >
          Force update {forceOn ? `ON — below build ${min}` : 'off'}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Latest version (name)" hint="As shown in the store, e.g. 10.0.3">
          <input className={input} value={v.latestVersion} onChange={set('latestVersion')} placeholder="10.0.3" />
        </Field>
        <Field label="Latest build number" hint={v.platform === 'android' ? 'versionCode — the +12 in 10.0.3+12' : 'CFBundleVersion'}>
          <input className={input} type="number" min={0} value={v.latestBuild} onChange={set('latestBuild')} />
        </Field>
        <Field label="Minimum supported build" hint="Builds below this must update. 0 = force update off.">
          <input className={input} type="number" min={0} value={v.minSupportedBuild} onChange={set('minSupportedBuild')} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Optional update — title">
          <input className={input} value={v.optionalTitle} onChange={set('optionalTitle')} placeholder="Update available" />
        </Field>
        <Field label="Force update — title">
          <input className={input} value={v.forceTitle} onChange={set('forceTitle')} placeholder="Update required" />
        </Field>
        <Field label="Optional update — message">
          <textarea className={`${input} h-20 py-2`} value={v.optionalMessage} onChange={set('optionalMessage')} placeholder="A new version of Justiceland is ready, with fixes and improvements." />
        </Field>
        <Field label="Force update — message">
          <textarea className={`${input} h-20 py-2`} value={v.forceMessage} onChange={set('forceMessage')} placeholder="This version is no longer supported. Please update to continue." />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Store link" hint={v.platform === 'ios' ? 'https://apps.apple.com/app/id<APP_ID>' : ''}>
          <input className={input} value={v.storeUrl} onChange={set('storeUrl')} />
        </Field>
      </div>

      {forceOn && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Everyone on build {min - 1} or older will be blocked until they update. Save this only once build {latest || '?'} is
          100% live in the {v.platform === 'ios' ? 'App Store' : 'Play Store'}.
        </p>
      )}
      {min > latest && (
        <p className="mt-3 text-[12.5px] text-rose-600">Minimum supported build cannot be above the latest build.</p>
      )}
      {error && (
        <p className="mt-3 flex items-start gap-2 text-[13px] text-rose-600">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || min > latest}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? 'Saved' : `Save ${LABEL[v.platform]}`}
        </button>
        <span className="text-[12px] text-ink/45">
          {v.updatedAt ? `Last changed ${formatDate(v.updatedAt)}${v.updatedBy ? ` by ${v.updatedBy}` : ''}. ` : ''}
          Phones pick up a change within 5 minutes.
        </span>
      </div>
    </section>
  );
}
