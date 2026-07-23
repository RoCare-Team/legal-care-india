'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClickToCall } from '@/hooks/useClickToCall';
import CallStatusModal from '@/components/consultation/CallStatusModal';
import AuthGateModal from '@/components/profile/AuthGateModal';

/**
 * CardContactActions — the Call / Chat / Email buttons on an AdvocateCard.
 * Signed-out visitors are prompted to create an account before contacting.
 * Renders three buttons (as grid children) plus the gate and call modals.
 *
 * @param {object} props
 * @param {{ phone?: string, whatsapp?: string, email?: string }} props.contact
 * @param {string} props.name
 * @param {string} [props.advocateId]  lawyer MongoDB _id. Without it Call falls
 *   back to a plain `tel:` link, so older call sites keep working unchanged.
 */
export default function CardContactActions({ contact = {}, name, advocateId }) {
  const { role, loading } = useAuth();
  const call = useClickToCall();
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

  /**
   * A signed-in client gets a bridged call — the server rings the lawyer and
   * joins the client once the lawyer answers. Lawyers, and clients on a
   * deployment with no dialler configured, fall through to the `tel:` link the
   * button already carries.
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
    if (role !== 'user' || !advocateId) return;
    e.preventDefault();
    call.start(advocateId, { fallbackTel: contact?.phone || '' });
  };

  const base =
    'flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-surface py-2.5 text-sm font-medium transition-colors';

  return (
    <>
      <a
        href={`tel:${contact?.phone || ''}`}
        onClick={onCall}
        aria-label={`Call ${name}`}
        className={`${base} text-blue-500 hover:border-blue-400 hover:bg-blue-500/10`}
      >
        <Phone className="h-4 w-4" />
        {call.status === 'dialing' ? '…' : 'Call'}
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
      <CallStatusModal
        status={call.status}
        error={call.error}
        advocateName={name}
        onClose={call.reset}
      />
    </>
  );
}
