'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button, FormField, Input, Textarea } from '@/components/ui';

/**
 * ContactForm — general enquiry form (UI only; shows a success state).
 */
export default function ContactForm() {
  const [data, setData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const set = (field) => (e) => setData((p) => ({ ...p, [field]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="grid place-items-center rounded-2xl border border-ink/8 bg-surface p-10 text-center shadow-card">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">Message sent!</h2>
        <p className="mt-1 max-w-sm text-sm text-ink/60">
          Thanks for reaching out. Our team will get back to you within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full Name" htmlFor="c-name">
          <Input id="c-name" value={data.name} onChange={set('name')} required placeholder="Your name" />
        </FormField>
        <FormField label="Email" htmlFor="c-email">
          <Input id="c-email" type="email" value={data.email} onChange={set('email')} required placeholder="you@example.com" />
        </FormField>
        <FormField label="Subject" htmlFor="c-subject" className="sm:col-span-2">
          <Input id="c-subject" value={data.subject} onChange={set('subject')} placeholder="How can we help?" />
        </FormField>
        <FormField label="Message" htmlFor="c-message" className="sm:col-span-2">
          <Textarea id="c-message" rows={5} value={data.message} onChange={set('message')} required placeholder="Write your message..." />
        </FormField>
      </div>
      <Button type="submit" className="mt-6" leftIcon={<Send className="h-4 w-4" />}>
        Send Message
      </Button>
    </form>
  );
}
