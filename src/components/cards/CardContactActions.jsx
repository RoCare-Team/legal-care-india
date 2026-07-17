'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AuthGateModal from '@/components/profile/AuthGateModal';

/**
 * CardContactActions — the Call / Chat / Email buttons on an AdvocateCard.
 * Signed-out visitors are prompted to create an account before contacting.
 * Renders three buttons (as grid children) plus the gate modal.
 *
 * @param {object} props
 * @param {{ phone?: string, whatsapp?: string, email?: string }} props.contact
 * @param {string} props.name
 */
export default function CardContactActions({ contact = {}, name }) {
  const { role, loading } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const authed = role !== null;

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

  const base =
    'flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-surface py-2.5 text-sm font-medium transition-colors';

  return (
    <>
      <a
        href={`tel:${contact?.phone || ''}`}
        onClick={gate}
        aria-label={`Call ${name}`}
        className={`${base} text-blue-500 hover:border-blue-400 hover:bg-blue-500/10`}
      >
        <Phone className="h-4 w-4" />
        Call
      </a>
      <a
        href={`https://wa.me/${contact?.whatsapp || ''}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={gate}
        aria-label={`WhatsApp ${name}`}
        className={`${base} text-emerald-500 hover:border-emerald-400 hover:bg-emerald-500/10`}
      >
        <MessageCircle className="h-4 w-4" />
        Chat
      </a>
      <a
        href={`mailto:${contact?.email || ''}`}
        onClick={gate}
        aria-label={`Email ${name}`}
        className={`${base} text-red-400 hover:border-red-400 hover:bg-red-500/10`}
      >
        <Mail className="h-4 w-4" />
        Email
      </a>

      <AuthGateModal open={gateOpen} onClose={() => setGateOpen(false)} advocateName={name} />
    </>
  );
}
