'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Mail, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import AuthGateModal from './AuthGateModal';

/**
 * ProfileContactActions — the Call / WhatsApp / Email actions on a profile.
 * Signed-out visitors are prompted to create an account before contacting.
 *
 * @param {object} props
 * @param {{ phone?: string, whatsapp?: string, email?: string }} props.contact
 * @param {string} props.name
 * @param {string} props.waText  pre-encoded WhatsApp message
 */
export default function ProfileContactActions({ contact = {}, name, waText }) {
  const { role, loading } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const authed = role !== null;

  // Signed out → block the action and show the sign-up prompt instead.
  const gate = (e) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    if (!authed) {
      e.preventDefault();
      setGateOpen(true);
    }
  };

  return (
    <>
      <div className="mt-4 space-y-2">
        {contact.phone && (
          <Button
            href={`tel:${contact.phone.replace(/\s/g, '')}`}
            onClick={gate}
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
            onClick={gate}
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
            onClick={gate}
            variant="outline"
            fullWidth
            leftIcon={<Mail className="h-4 w-4" />}
          >
            Send Email
          </Button>
        )}
        <Button variant="ghost" fullWidth disabled leftIcon={<CalendarCheck className="h-4 w-4" />}>
          Book Consultation (Soon)
        </Button>
      </div>

      <AuthGateModal open={gateOpen} onClose={() => setGateOpen(false)} advocateName={name} />
    </>
  );
}
