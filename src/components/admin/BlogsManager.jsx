'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Trash2, ExternalLink, CheckCircle2, Lock, Upload, ImageIcon, X, Loader2,
  Pencil, FileText, Eye, EyeOff, Undo2,
} from 'lucide-react';
import { Button, FormField, Input, Select, Textarea } from '@/components/ui';
import SmartImage from '@/components/shared/SmartImage';

/** The categories an article can be filed under. */
const CATEGORIES = [
  'Legal Guide',
  'Fees & Costs',
  'Property Law',
  'Consumer Law',
  'Criminal Law',
  'Family Law',
  'Corporate Law',
  'Documentation',
];

const EMPTY = {
  id: '',
  title: '',
  category: 'Legal Guide',
  excerpt: '',
  content: '',
  coverImage: '',
  published: true,
};

/**
 * BlogsManager — admin UI to write, edit, publish and delete articles.
 *
 * The form doubles as the editor: picking Edit on a row loads it in place,
 * so there is no second screen to keep in sync.
 *
 * Built-in posts (the ones shipped in code) have no database row, so they can
 * be removed from the site but not edited or turned into drafts — their text
 * only exists in the source file. Removing one is reversible for that same
 * reason: nobody could type a built-in article back in by hand, so the ones
 * taken down are kept in a list below with a way back.
 *
 * @param {object} props
 * @param {Array} props.posts  merged list (admin-written + built-in), each with
 *                             a `custom` flag and, for built-ins, `hidden`
 */
export default function BlogsManager({ posts }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState('');

  const editing = Boolean(form.id);
  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setOk('');
  };

  const reset = () => {
    setForm(EMPTY);
    setError('');
    setOk('');
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not upload the image.');
        return;
      }
      set('coverImage', payload.url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (form.title.trim().length < 4) return setError('Please enter the article title.');
    if (form.content.trim().length < 20) return setError('Please write the article content.');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/blogs', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not save the article.');
        return;
      }
      setOk(payload.message || 'Saved.');
      setForm(EMPTY);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (post) => {
    setError('');
    setOk('');
    setForm({
      id: post.id,
      title: post.title,
      category: post.category || 'Legal Guide',
      excerpt: post.excerpt || '',
      content: post.content || '',
      coverImage: post.coverImage || '',
      published: post.published !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePublished = async (post) => {
    setBusyId(post.slug);
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, published: !post.published }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusyId('');
    }
  };

  /**
   * Take an article off the site.
   *
   * An admin post is deleted by id and is gone for good, so the confirm says
   * so. A built-in one is only hidden — its text is still in the code and the
   * Removed list below can put it back — so it asks for less alarm.
   */
  const remove = async (post) => {
    const message = post.custom
      ? `Delete "${post.title}"? This cannot be undone, and its page will stop working.`
      : `Remove "${post.title}" from the site? You can put it back from the Removed list below.`;
    if (!window.confirm(message)) return;

    const query = post.custom
      ? `id=${encodeURIComponent(post.id)}`
      : `slug=${encodeURIComponent(post.slug)}`;

    setBusyId(post.slug);
    try {
      const res = await fetch(`/api/admin/blogs?${query}`, { method: 'DELETE' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not remove the article.');
        return;
      }
      if (post.custom && form.id === post.id) reset();
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusyId('');
    }
  };

  /** Put a removed built-in article back on the site. */
  const restore = async (post) => {
    setBusyId(post.slug);
    try {
      const res = await fetch('/api/admin/blogs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: post.slug }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not restore the article.');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusyId('');
    }
  };

  // Removed built-ins are listed on their own below rather than greyed out
  // among the live ones, where they read as articles the site is still showing.
  const [live, removed] = useMemo(
    () => [posts.filter((p) => !p.hidden), posts.filter((p) => p.hidden)],
    [posts]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
      {/* Write / edit */}
      <div className="h-fit rounded-2xl border border-ink/8 bg-surface p-5 shadow-card lg:sticky lg:top-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            {editing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </span>
          <h3 className="font-display text-lg font-semibold text-ink">
            {editing ? 'Edit article' : 'Write an article'}
          </h3>
        </div>
        <p className="mt-1 text-sm text-ink/55">
          {editing
            ? 'The web address stays the same, so existing links keep working.'
            : 'Publishes to /blogs straight away.'}
        </p>

        <form onSubmit={save} className="mt-4 space-y-4">
          <FormField label="Title" htmlFor="b-title">
            <Input
              id="b-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. How to Choose the Right Lawyer"
            />
          </FormField>

          <FormField label="Category" htmlFor="b-cat">
            <Select
              id="b-cat"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              options={CATEGORIES}
            />
          </FormField>

          <FormField
            label="Short summary"
            htmlFor="b-excerpt"
            hint="Shown on the card and in Google results."
          >
            <Textarea
              id="b-excerpt"
              rows={3}
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder="One or two lines about what this article covers."
            />
          </FormField>

          <FormField
            label="Article content"
            htmlFor="b-content"
            hint="Leave a blank line between paragraphs. Start a line with ## for a heading."
          >
            <Textarea
              id="b-content"
              rows={12}
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder={'## Where to start\n\nWrite the article here…'}
            />
          </FormField>

          <FormField label="Cover image (optional)" htmlFor="b-img">
            {form.coverImage ? (
              <div className="relative overflow-hidden rounded-xl border border-ink/10">
                <span className="relative block h-28 w-full">
                  <SmartImage src={form.coverImage} alt="Cover preview" sizes="400px" className="object-cover" />
                </span>
                <button
                  type="button"
                  onClick={() => set('coverImage', '')}
                  aria-label="Remove image"
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-ink/60 text-white backdrop-blur hover:bg-ink/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="b-img"
                className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/20 bg-ink/[0.02] px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                    <span className="text-sm font-medium text-ink/60">Uploading…</span>
                  </>
                ) : (
                  <>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-ink/70">Choose image from your computer</span>
                    <span className="flex items-center gap-1 text-[11px] text-ink/40">
                      <ImageIcon className="h-3 w-3" aria-hidden="true" />
                      JPG, PNG, WebP · max 5 MB
                    </span>
                  </>
                )}
                <input
                  id="b-img"
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </FormField>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/10 bg-ink/[0.02] px-3.5 py-3">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set('published', e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            <span className="text-sm">
              <span className="font-medium text-ink">Publish on the site</span>
              <span className="block text-xs text-ink/50">
                Uncheck to keep it as a draft only you can see.
              </span>
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {ok && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {ok}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              fullWidth
              disabled={saving || uploading}
              leftIcon={editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish article'}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={reset}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Existing articles */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">
          All articles ({live.length})
        </p>
        <div className="space-y-3">
          {live.map((p) => (
            <div
              key={p.slug}
              className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-surface p-4 shadow-card"
            >
              {p.coverImage ? (
                <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-xl">
                  <SmartImage src={p.coverImage} alt="" sizes="64px" className="object-cover" />
                </span>
              ) : (
                <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-ink">{p.title}</p>
                  {!p.custom ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink/6 px-2 py-0.5 text-[10px] font-semibold text-ink/45">
                      <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                      Built-in
                    </span>
                  ) : p.published ? (
                    <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Published
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Draft
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-ink/50">
                  {p.category} · {p.date || 'just now'} · {p.readMinutes} min read
                </p>
              </div>

              {p.published && (
                <Link
                  href={`/blogs/${p.slug}`}
                  target="_blank"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-primary"
                  aria-label={`Open ${p.title}`}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}

              {/* Publish/draft and Edit need a database row, so they are for
                  admin posts only. Removal is offered on every article — a
                  built-in is hidden rather than deleted, but from here the
                  difference is only in the confirm and how easily it comes
                  back, not in whether the button exists. */}
              {p.custom && (
                <>
                  <button
                    type="button"
                    onClick={() => togglePublished(p)}
                    disabled={busyId === p.slug}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-primary disabled:opacity-50"
                    aria-label={p.published ? `Unpublish ${p.title}` : `Publish ${p.title}`}
                    title={p.published ? 'Move back to draft' : 'Publish'}
                  >
                    {p.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => edit(p)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-primary"
                    aria-label={`Edit ${p.title}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => remove(p)}
                disabled={busyId === p.slug}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/40 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                aria-label={p.custom ? `Delete ${p.title}` : `Remove ${p.title}`}
                title={p.custom ? 'Delete permanently' : 'Remove from the site'}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        {removed.length > 0 && (
          <div className="mt-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/40">
              Removed ({removed.length})
            </p>
            <p className="mb-3 text-xs text-ink/45">
              Built-in articles taken off the site. Nothing is lost — put one back any time.
            </p>
            <div className="space-y-2">
              {removed.map((p) => (
                <div
                  key={p.slug}
                  className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-ink/[0.02] px-4 py-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/6 text-ink/35">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink/55">{p.title}</p>
                    <p className="truncate text-xs text-ink/40">{p.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restore(p)}
                    disabled={busyId === p.slug}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink/12 bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
