import { Phone, MessageCircle, Mail } from 'lucide-react';

/**
 * ProfileMobileBar — fixed bottom action bar (mobile only) giving one-tap
 * access to Call / WhatsApp / Email on the public profile.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileMobileBar({ advocate }) {
  const { contact = {}, name } = advocate;
  const waText = encodeURIComponent(`Hi ${name}, I found your profile on Legal Care India.`);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-surface/95 p-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        <a
          href={`tel:${(contact.phone || '').replace(/\s/g, '')}`}
          className="flex flex-col items-center gap-1 rounded-xl bg-primary py-2 text-xs font-semibold text-white"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </a>
        <a
          href={`https://wa.me/${contact.whatsapp}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </a>
        <a
          href={`mailto:${contact.email}`}
          className="flex flex-col items-center gap-1 rounded-xl border border-ink/15 py-2 text-xs font-semibold text-ink/80"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Email
        </a>
      </div>
    </div>
  );
}
