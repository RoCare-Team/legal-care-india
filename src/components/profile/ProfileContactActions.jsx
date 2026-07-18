'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Mail, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import AuthGateModal from './AuthGateModal';
import BookConsultationModal from './BookConsultationModal';

/**
 * ProfileContactActions — the Call / WhatsApp / Email / Book Consultation
 * actions on a profile. Signed-out visitors are prompted to create an account
 * before contacting or booking; the paid live-chat booking is user-only.
 *
 * @param {object} props
 * @param {{ phone?: string, whatsapp?: string, email?: string }} props.contact
 * @param {string} props.name
 * @param {string} props.waText      pre-encoded WhatsApp message
 * @param {string} props.advocateId  advocate MongoDB _id (for activity + booking)
 * @param {Array}  [props.plans]     the advocate's own live-chat rates
 */
export default function ProfileContactActions({ contact = {}, name, waText, advocateId, plans = [] }) {
  const { role, user, loading } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const authed = role !== null;

  // Book Consultation: signed-out → gate; advocate → not applicable; user → book.
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

  return (
    <>
      <div className="space-y-2">
        {/* Primary CTA — book a paid live chat, shown when the advocate offers it. */}
        {role !== 'advocate' && plans.length > 0 && (
          <Button
            type="button"
            onClick={onBook}
            fullWidth
            leftIcon={<CalendarCheck className="h-4 w-4" />}
          >
            Book Consultation
          </Button>
        )}
        {contact.phone && (
          <Button
            href={`tel:${contact.phone.replace(/\s/g, '')}`}
            onClick={gate('call')}
            variant={plans.length > 0 ? 'outline' : 'primary'}
            fullWidth
            leftIcon={<Phone className="h-4 w-4" />}
          >
            Call Now
          </Button>
        )}
        {contact.whatsapp && (
          <Button
            href={`https://wa.me/${contact.whatsapp}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={gate('whatsapp')}
            fullWidth
            className="bg-emerald-600 hover:bg-emerald-700"
            leftIcon={<MessageCircle className="h-4 w-4" />}
          >
            WhatsApp
          </Button>
        )}
        {contact.email && (
          <Button
            href={`mailto:${contact.email}`}
            onClick={gate('email')}
            variant="outline"
            fullWidth
            leftIcon={<Mail className="h-4 w-4" />}
          >
            Send Email
          </Button>
        )}
      </div>

      <AuthGateModal open={gateOpen} onClose={() => setGateOpen(false)} advocateName={name} />
      <BookConsultationModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        advocateId={advocateId}
        advocateName={name}
        walletBalance={user?.walletBalance || 0}
        plans={plans}
      />
    </>
  );
}
