'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Mail, CalendarCheck, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import AuthGateModal from './AuthGateModal';
import BookConsultationModal from './BookConsultationModal';
import AudioConsultModal from './AudioConsultModal';

/**
 * ProfileContactActions — the Call / WhatsApp / Email / Book Consultation
 * actions on a profile. Signed-out visitors are prompted to create an account
 * before contacting or booking; the paid bookings are user-only.
 *
 * @param {object} props
 * @param {{ phone?: string, whatsapp?: string, email?: string }} props.contact
 * @param {string} props.name
 * @param {string} props.waText      pre-encoded WhatsApp message
 * @param {string} props.advocateId  lawyer MongoDB _id (for activity + booking)
 * @param {number} [props.chatRate]  the lawyer's ₹/min for live chat
 * @param {number} [props.audioRate] the lawyer's ₹/min for audio calls
 */
/**
 * One of the three direct ways to reach a lawyer: an icon over a label, in a
 * box small enough that it never competes with Consult Now above it.
 */
function DirectAction({ href, external, onClick, icon: Icon, label, tone }) {
  return (
    <a
      href={href}
      onClick={onClick}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`flex h-[52px] flex-col items-center justify-center gap-1 rounded-xl border text-[11.5px] font-semibold transition-colors ${tone}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}

export default function ProfileContactActions({
  contact = {}, name, waText, advocateId, chatRate = 0, audioRate = 0, slotPrices,
}) {
  const { role, user, loading } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const authed = role !== null;

  // Book Consultation: signed-out → gate; lawyer → not applicable; user → book.
  const onBook = () => {
    if (loading) return;
    if (!authed) {
      setGateOpen(true);
      return;
    }
    setBookOpen(true);
  };

  // Fire-and-forget: log a contact tap to the user's activity history.
  const track = (type) => {
    if (role !== 'user' || !advocateId) return;
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advocateId, type }),
      keepalive: true,
    }).catch(() => {});
  };

  // Signed out → block the action and show the sign-up prompt instead.
  // Signed in → let the link proceed and log the interaction.
  const gate = (type) => (e) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    if (!authed) {
      e.preventDefault();
      setGateOpen(true);
      return;
    }
    track(type);
  };

  /**
   * Call is the one action that does not simply follow its href. For a signed-in
   * client it opens the paid audio-consultation booking, priced from the
   * lawyer's own per-minute audio rate. Lawyers keep the plain `tel:` behaviour, which is
   * why the href stays on the button.
   */
  const onCall = (e) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    if (!authed) {
      e.preventDefault();
      setGateOpen(true);
      return;
    }
    if (role !== 'user' || !advocateId) {
      track('call');
      return; // let the tel: link through
    }
    e.preventDefault();
    setAudioOpen(true);
  };

  return (
    <>
      <div className="space-y-2">
        {/* Two decisions, in the order they are made: talk now, or put it in
            the diary. They used to be four buttons of equal weight — Book,
            Call, WhatsApp, Email — which is a menu, not a call to action, and
            gave a paid consultation the same prominence as an email nobody
            answers on a Sunday.

            The direct ways to reach the lawyer are still here, underneath, as
            a row of three. Nothing was removed; it was ranked. */}
        {role !== 'advocate' && (
          <Button
            type="button"
            onClick={onBook}
            fullWidth
            size="lg"
            leftIcon={<MessagesSquare className="h-4 w-4" />}
          >
            Consult Now
          </Button>
        )}

        {role !== 'advocate' && (
          <Button
            type="button"
            onClick={onBook}
            variant="outline"
            fullWidth
            leftIcon={<CalendarCheck className="h-4 w-4" />}
          >
            Book Appointment
          </Button>
        )}

        {/* Phone, WhatsApp and email — the ways to reach this lawyer that do
            not start a paid session, so they are labelled but small. */}
        {(contact.phone || contact.whatsapp || contact.email) && (
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {contact.phone && (
              <DirectAction
                href={`tel:${contact.phone.replace(/s/g, "")}`}
                onClick={onCall}
                icon={Phone}
                label="Call"
                tone="border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:border-emerald-400"
              />
            )}
            {contact.whatsapp && (
              <DirectAction
                href={`https://wa.me/${contact.whatsapp}?text=${waText}`}
                external
                onClick={gate('whatsapp')}
                icon={MessageCircle}
                label="WhatsApp"
                tone="border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:border-emerald-400"
              />
            )}
            {contact.email && (
              <DirectAction
                href={`mailto:${contact.email}`}
                onClick={gate('email')}
                icon={Mail}
                label="Email"
                tone="border-ink/12 bg-surface text-primary hover:border-primary/40"
              />
            )}
          </div>
        )}
      </div>

      <AuthGateModal open={gateOpen} onClose={() => setGateOpen(false)} advocateName={name} />
      <AudioConsultModal
        slotPrices={slotPrices}
        open={audioOpen}
        onClose={() => setAudioOpen(false)}
        advocateId={advocateId}
        advocateName={name}
        walletBalance={user?.walletBalance || 0}
        rate={audioRate}
      />
      <BookConsultationModal
        slotPrices={slotPrices}
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        advocateId={advocateId}
        advocateName={name}
        walletBalance={user?.walletBalance || 0}
        rate={chatRate}
      />
    </>
  );
}
