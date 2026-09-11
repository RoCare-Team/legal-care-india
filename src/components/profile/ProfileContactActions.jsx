'use client';

import { useState } from 'react';
import { Phone, Mail, CalendarCheck, MessagesSquare } from 'lucide-react';
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
/** WhatsApp's own mark — a generic speech bubble doesn't say "WhatsApp". */
function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47a9.42 9.42 0 0 1 6.7 2.78 9.41 9.41 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.52A11.32 11.32 0 0 0 12.05.64C5.77.64.66 5.75.66 12.03c0 2.01.52 3.97 1.52 5.7L.56 23.64l6.05-1.59a11.37 11.37 0 0 0 5.44 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.34-8.06z" />
    </svg>
  );
}

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
      className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[12.5px] font-semibold transition-colors ${tone}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
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
            {/* Each in the colour people already know it by — phone blue,
                WhatsApp's green, mail red — so the three are told apart at a
                glance instead of read. Tinted rather than solid: solid colour
                here would out-shout Consult Now above them. */}
            {contact.phone && (
              <DirectAction
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                onClick={onCall}
                icon={Phone}
                label="Call"
                tone="border-[#1A73E8]/30 bg-[#1A73E8]/[0.07] text-[#1A73E8] hover:border-[#1A73E8] hover:bg-[#1A73E8] hover:text-white"
              />
            )}
            {contact.whatsapp && (
              <DirectAction
                href={`https://wa.me/${contact.whatsapp}?text=${waText}`}
                external
                onClick={gate('whatsapp')}
                icon={WhatsAppIcon}
                label="WhatsApp"
                tone="border-[#25D366]/40 bg-[#25D366]/[0.09] text-[#128C3E] hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
              />
            )}
            {contact.email && (
              <DirectAction
                href={`mailto:${contact.email}`}
                onClick={gate('email')}
                icon={Mail}
                label="Email"
                tone="border-[#EA4335]/30 bg-[#EA4335]/[0.06] text-[#D93025] hover:border-[#EA4335] hover:bg-[#EA4335] hover:text-white"
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
