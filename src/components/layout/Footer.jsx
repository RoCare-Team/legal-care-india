import Link from 'next/link';
import { Mail, Phone, MapPin, MessageCircle, Twitter, Facebook, Linkedin, Instagram } from 'lucide-react';
import Container from '@/components/ui/Container';
import Logo from '@/components/shared/Logo';
import { FOOTER_NAV } from '@/constants/navigation';
import { SITE, CONTACT, SOCIAL } from '@/constants/site';


const SOCIAL_LINKS = [
  { label: 'Twitter', href: SOCIAL.twitter, icon: Twitter },
  { label: 'Facebook', href: SOCIAL.facebook, icon: Facebook },
  { label: 'LinkedIn', href: SOCIAL.linkedin, icon: Linkedin },
  { label: 'Instagram', href: SOCIAL.instagram, icon: Instagram },
];

/**
 * Footer — global site footer with brand, navigation columns, contact and legal.
 */
export default function Footer() {
  const year = 2026;

  return (
    <footer className="bg-primary-dark text-white">
      <Container className="py-9">
        {/* Six columns now, not five: the brand, the four link lists, and
            Contact. The two on the ends carry sentences and an address, so
            they get more room than the link lists between them — at an equal
            1fr the email addresses wrapped mid-word. */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_repeat(4,0.85fr)_1.25fr]">
          <div className="max-w-sm">
            <Logo onDark />
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              {SITE.description}
            </p>
            {/* The two mailboxes stay with the brand, not in the Contact
                column: they are how you write to Justiceland, which belongs
                beside who Justiceland is. Contact holds the ways to reach a
                person now — phone, WhatsApp, the office. */}
            <div className="mt-5 space-y-2 text-sm text-white/75">
              {/* Support first — it is the address someone needs when
                  something has gone wrong. */}
              <a href={`mailto:${CONTACT.email}`} className="flex items-start gap-2 hover:text-accent">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="break-all">{CONTACT.email}</span>
              </a>
              <a href={`mailto:${CONTACT.infoEmail}`} className="flex items-start gap-2 hover:text-accent">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="break-all">{CONTACT.infoEmail}</span>
              </a>
            </div>
          </div>

          {FOOTER_NAV.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact as its own column, last — beside Legal. The two
              mailboxes stayed with the brand; what is here is how to reach
              somebody now, which under the description read as part of the
              blurb rather than something to act on. */}
          <div>
            <h3 className="text-sm font-semibold text-white">Contact</h3>
            <div className="mt-4 space-y-2.5 text-sm text-white/70">
              <a href={`tel:${CONTACT.phone}`} className="flex items-center gap-2 hover:text-accent">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" /> {CONTACT.phone}
              </a>
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-accent"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> WhatsApp
              </a>
              {/* Each line of the address on its own line — run together it
                  stops looking like somewhere you could walk into. */}
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="not-italic">
                  {CONTACT.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row">
          <p className="text-sm text-white/55">
            © {year} {SITE.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-accent"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-white/40 sm:text-left">
          Disclaimer: {SITE.name} is a lawyer discovery and directory platform. It is
          not a law firm and does not provide legal advice, representation, or referrals.
          Listings do not constitute endorsements.
        </p>
      </Container>
    </footer>
  );
}
