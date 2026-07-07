import Link from 'next/link';
import { Mail, Phone, Twitter, Facebook, Linkedin, Instagram } from 'lucide-react';
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
    <footer className="border-t border-ink/8 bg-muted/60">
      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ink/60">
              {SITE.description}
            </p>
            <div className="mt-5 space-y-2 text-sm text-ink/70">
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-primary">
                <Mail className="h-4 w-4" /> {CONTACT.email}
              </a>
              <a href={`tel:${CONTACT.phone}`} className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4" /> {CONTACT.phone}
              </a>
            </div>
          </div>

          {FOOTER_NAV.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-ink">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/60 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink/8 pt-6 sm:flex-row">
          <p className="text-sm text-ink/55">
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
                className="grid h-9 w-9 place-items-center rounded-lg text-ink/55 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink/45 sm:text-left">
          Disclaimer: {SITE.name} is an advocate discovery and directory platform. It is
          not a law firm and does not provide legal advice, representation, or referrals.
          Listings do not constitute endorsements.
        </p>
      </Container>
    </footer>
  );
}
