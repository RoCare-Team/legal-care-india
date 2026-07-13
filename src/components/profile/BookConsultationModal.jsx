'use client';

import { useEffect, useState } from 'react';
import { X, CalendarCheck, Send, CheckCircle2 } from 'lucide-react';
import { Button, FormField, Input, Textarea } from '@/components/ui';

/**
 * BookConsultationModal — the form a signed-in user fills to request a
 * consultation with an advocate. On submit it POSTs to /api/enquiries and the
 * enquiry lands in that advocate's dashboard.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.advocateId    advocate MongoDB _id
 * @param {string} props.advocateName
 * @param {object} [props.user]         logged-in user (to prefill name/phone/email)
 */
export default function BookConsultationModal({ open, onClose, advocateId, advocateName, user }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Prefill from the logged-in user when the modal opens.
  useEffect(() => {
    if (open && user) {
      setName((n) => n || user.name || '');
      setPhone((p) => p || user.phone || '');
      setEmail((e) => e || user.email || '');
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && !loading && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const close = () => {
    if (loading) return;
    setError('');
    // Reset the success/message state so reopening shows a fresh form.
    if (done) {
      setDone(false);
      setMessage('');
      setPreferredDate('');
    }
    onClose();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Please enter your name.');
    if (phone.replace(/\D/g, '').length < 10) return setError('Please enter a valid phone number.');
    if (message.trim().length < 10) return setError('Please describe your legal matter briefly.');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advocateId, name, phone, email, preferredDate, message }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not send your request. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-title"
      onClick={close}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-surface p-6 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <h2 id="book-title" className="font-display text-lg font-semibold text-ink">
              Book Consultation
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden="true" />
            <p className="font-semibold text-ink">Request sent!</p>
            <p className="text-sm text-ink/55">
              {advocateName || 'The advocate'} has received your consultation request and will
              reach out to you soon.
            </p>
            <Button type="button" className="mt-3" onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-ink/60">
              Share a few details and {advocateName || 'the advocate'} will get back to you.
            </p>
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <FormField label="Your name" htmlFor="b-name">
                <Input
                  id="b-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  maxLength={80}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Phone" htmlFor="b-phone">
                  <Input
                    id="b-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98xxxxxxx"
                    maxLength={20}
                  />
                </FormField>
                <FormField label="Email (optional)" htmlFor="b-email">
                  <Input
                    id="b-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    maxLength={120}
                  />
                </FormField>
              </div>
              <FormField label="Preferred date/time (optional)" htmlFor="b-date">
                <Input
                  id="b-date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  placeholder="e.g. This Saturday morning"
                  maxLength={40}
                />
              </FormField>
              <FormField label="Describe your legal matter" htmlFor="b-message">
                <Textarea
                  id="b-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Briefly explain what you need help with…"
                />
              </FormField>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <Button type="submit" fullWidth disabled={loading} leftIcon={<Send className="h-4 w-4" />}>
                {loading ? 'Sending…' : 'Send request'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
