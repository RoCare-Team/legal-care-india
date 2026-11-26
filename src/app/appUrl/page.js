import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { MessageSquareText, PhoneCall, Video, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui';
import { APP_STORE_URLS, SITE } from '@/constants/site';
import { StoreBadge } from '@/components/shared/AppDownload';

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
            {/* Straight to the stores here — this page is where /appUrl ends up. */}
            <StoreBadge store="android" href={APP_STORE_URLS.android} />
            <StoreBadge store="ios" href={APP_STORE_URLS.ios} />
          </div>

          <p className="mt-6 text-xs text-ink/40">Free to download · Android &amp; iPhone</p>
        </div>
      </Container>
    </div>
  );
}
