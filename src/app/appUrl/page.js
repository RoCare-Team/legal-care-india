import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { MessageSquareText, PhoneCall, Video, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui';
import { APP_STORE_URLS, SITE } from '@/constants/site';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Get the ${SITE.name} app`,
  description: `Download the ${SITE.name} app on Android or iPhone.`,
  robots: { index: false, follow: true },
};

const FEATURES = [
  { icon: PhoneCall, label: 'Call' },
  { icon: MessageSquareText, label: 'Chat' },
  { icon: Video, label: 'Video' },
  { icon: ShieldCheck, label: 'Private & secure' },
];

/**
 * /appUrl — the one link to share for the app.
 *
 * An iPhone or iPad goes straight to the App Store, an Android phone straight
 * to Google Play; anything else (a laptop, an unknown browser) gets both store
 * buttons and picks.
 */
export default async function AppUrlPage() {
  const ua = (await headers()).get('user-agent') || '';

  // iPadOS reports itself as a Mac; "Mobile" in a Mac UA is the iPad.
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))) {
    redirect(APP_STORE_URLS.ios);
  }
  if (/Android/i.test(ua)) redirect(APP_STORE_URLS.android);

  return (
    <div className="bg-gradient-to-b from-[#EEF2F8] to-transparent">
      <Container className="grid min-h-[72vh] place-items-center py-14 sm:py-20">
        <div className="w-full max-w-xl rounded-3xl border border-ink/8 bg-surface p-8 text-center shadow-card sm:p-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/apple-icon.png"
            alt={`${SITE.name} app icon`}
            width={88}
            height={88}
            className="mx-auto h-[88px] w-[88px] rounded-[22px] shadow-[0_14px_30px_-12px_rgba(30,58,95,0.45)] ring-1 ring-ink/10"
          />

          <h1 className="mt-6 font-display text-3xl font-bold text-ink sm:text-4xl">
            Get the {SITE.name} app
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-ink/60">
            Consult verified lawyers by call, chat or video — right from your phone.
          </p>

          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/5"
              >
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <StoreBadge href={APP_STORE_URLS.android} small="GET IT ON" big="Google Play" logo={<PlayLogo />} />
            <StoreBadge href={APP_STORE_URLS.ios} small="Download on the" big="App Store" logo={<AppleLogo />} />
          </div>

          <p className="mt-6 text-xs text-ink/40">Free to download · Android &amp; iPhone</p>
        </div>
      </Container>
    </div>
  );
}

/** A black store button in the stores' own badge style. */
function StoreBadge({ href, small, big, logo }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-14 w-[200px] items-center gap-3 rounded-xl bg-black px-4 text-left text-white ring-1 ring-white/10 transition-transform hover:-translate-y-0.5 hover:bg-neutral-900"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center">{logo}</span>
      <span className="leading-none">
        <span className="block text-[10.5px] font-medium tracking-wide text-white/80">{small}</span>
        <span className="mt-1 block text-[21px] font-semibold tracking-tight">{big}</span>
      </span>
    </a>
  );
}

/** Google Play's four-colour triangle. */
function PlayLogo() {
  return (
    <svg viewBox="0 0 512 512" className="h-7 w-7" aria-hidden="true">
      <path fill="#00D7FE" d="M48 59.5v393c0 9 4.4 16.9 11.1 21.4L276 256 59.1 38.1C52.4 42.6 48 50.5 48 59.5z" />
      <path fill="#00F076" d="M354.6 177.6 92.4 26.9c-11.2-6.4-24.3-5.8-33.3 11.2L276 256z" />
      <path fill="#FF3A44" d="M59.1 473.9c9 7.4 22.1 7.9 33.3 1.5l262.2-150.7L276 256z" />
      <path fill="#FFD500" d="m437.4 225.3-82.8-47.7L276 256l78.6 78.7 82.8-47.6c24.8-14.3 24.8-47.5 0-61.8z" />
    </svg>
  );
}

/** The Apple logo. */
function AppleLogo() {
  return (
    <svg viewBox="0 0 384 512" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}
