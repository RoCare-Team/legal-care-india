import Image from 'next/image';
import { PhoneCall, MessageSquareText, Video, ShieldCheck, Smartphone, Check } from 'lucide-react';
import { Container } from '@/components/ui';
import { APP_STORE_URLS, SITE } from '@/constants/site';

/**
 * The app, offered wherever it helps — the home page, city pages, the
 * directory, articles and the footer.
 *
 * Each badge goes straight to its own store: Google Play to the Play listing,
 * App Store to the App Store. The store links live in constants/site.
 *
 * The screens in the banner are the app's own Play Store screenshots, kept in
 * /public/app-screens so the page does not depend on Google's image host.
 */

const POINTS = [
  'Call, chat or video with verified lawyers',
  'Pay only for the minutes you use',
  'Anonymous mode — your name stays private',
];

/** Google Play's four-colour triangle. */
export function PlayLogo({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <path fill="#00D7FE" d="M48 59.5v393c0 9 4.4 16.9 11.1 21.4L276 256 59.1 38.1C52.4 42.6 48 50.5 48 59.5z" />
      <path fill="#00F076" d="M354.6 177.6 92.4 26.9c-11.2-6.4-24.3-5.8-33.3 11.2L276 256z" />
      <path fill="#FF3A44" d="M59.1 473.9c9 7.4 22.1 7.9 33.3 1.5l262.2-150.7L276 256z" />
      <path fill="#FFD500" d="m437.4 225.3-82.8-47.7L276 256l78.6 78.7 82.8-47.6c24.8-14.3 24.8-47.5 0-61.8z" />
    </svg>
  );
}

/** The Apple logo. */
export function AppleLogo({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

/**
 * One black store button in the stores' own badge style, opening that store.
 *
 * @param {object} props
 * @param {'android'|'ios'} props.store
 * @param {string} [props.href]   defaults to the store's own listing
 * @param {boolean} [props.small]
 */
export function StoreBadge({ store, href, small = false }) {
  const ios = store === 'ios';
  return (
    <a
      href={href || APP_STORE_URLS[ios ? 'ios' : 'android']}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ios ? 'Download on the App Store' : 'Get it on Google Play'}
      className={`inline-flex items-center gap-2.5 rounded-xl bg-black text-left text-white ring-1 ring-white/15 transition-transform hover:-translate-y-0.5 hover:bg-neutral-900 ${
        small ? 'h-11 w-[152px] px-3' : 'h-14 w-[188px] px-4'
      }`}
    >
      {ios ? <AppleLogo className={small ? 'h-6 w-6' : 'h-7 w-7'} /> : <PlayLogo className={small ? 'h-5 w-5' : 'h-7 w-7'} />}
      <span className="leading-none">
        <span className={`block font-medium tracking-wide text-white/80 ${small ? 'text-[9px]' : 'text-[10.5px]'}`}>
          {ios ? 'Download on the' : 'GET IT ON'}
        </span>
        <span className={`mt-0.5 block font-semibold tracking-tight ${small ? 'text-[16px]' : 'text-[20px]'}`}>
          {ios ? 'App Store' : 'Google Play'}
        </span>
      </span>
    </a>
  );
}

/** Both badges side by side. */
export function AppStoreBadges({ small = false, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <StoreBadge store="android" small={small} />
      <StoreBadge store="ios" small={small} />
    </div>
  );
}

/** One app screen in a phone frame. */
function Phone({ src, alt, className = '', priority = false }) {
  return (
    <div
      className={`overflow-hidden rounded-[26px] border-[5px] border-slate-900 bg-slate-900 shadow-[0_30px_60px_-24px_rgba(15,23,42,0.55)] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={600}
        height={1067}
        sizes="(max-width: 768px) 40vw, 220px"
        priority={priority}
        className="block h-auto w-full rounded-[21px]"
      />
    </div>
  );
}

/** Three of the app's screens, fanned: home in front, the directory and a profile behind. */
function PhoneFan() {
  return (
    <div className="relative mx-auto h-[290px] w-[290px] sm:h-[420px] sm:w-[440px]" aria-hidden="true">
      <span className="absolute inset-x-6 bottom-6 top-10 rounded-full bg-primary/15 blur-3xl" />
      <Phone
        src="/app-screens/screen-3.webp"
        alt=""
        className="absolute left-0 top-10 w-[34%] -rotate-[9deg] opacity-95"
      />
      <Phone
        src="/app-screens/screen-5.webp"
        alt=""
        className="absolute right-0 top-10 w-[34%] rotate-[9deg] opacity-95"
      />
      <Phone
        src="/app-screens/screen-4.webp"
        alt={`${SITE.name} app home screen`}
        className="absolute left-1/2 top-0 z-10 w-[42%] -translate-x-1/2"
      />
    </div>
  );
}

/**
 * The "get the app" banner.
 *
 * @param {object} props
 * @param {boolean} [props.compact]  one row, no phones — for inside a page
 * @param {string} [props.title]
 * @param {string} [props.text]
 */
export function AppDownloadBanner({
  compact = false,
  title = `Get the ${SITE.name} app`,
  text = 'Consult verified lawyers by call, chat or video — from your phone, wherever you are.',
}) {
  if (compact) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-ink/8 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:p-6">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/[0.07] text-primary ring-1 ring-inset ring-primary/10">
          <Smartphone className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-ink">{title}</p>
          <p className="mt-0.5 text-sm text-ink/60">{text}</p>
        </div>
        <AppStoreBadges small />
      </div>
    );
  }

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] border border-ink/8 bg-gradient-to-br from-[#EEF3FA] via-white to-[#F4F7FB] shadow-card">
          <span
            className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,rgba(30,58,95,0.10)_1px,transparent_0)] [background-size:20px_20px]"
            aria-hidden="true"
          />
          <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

          <div className="relative grid items-center gap-6 px-6 pt-9 sm:px-10 md:grid-cols-[1fr_auto] md:gap-4 md:py-6 lg:px-14">
            <div className="md:py-6">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-primary shadow-sm ring-1 ring-primary/10">
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                Now on Android &amp; iPhone
              </p>
              <h2 className="mt-4 font-display text-[1.75rem] font-bold leading-tight text-ink sm:text-[2.3rem]">{title}</h2>
              <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink/60">{text}</p>

              <ul className="mt-5 space-y-2">
                {POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-[14px] font-medium text-ink/75">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>

              <AppStoreBadges className="mt-7" />
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/45">
                <span className="inline-flex items-center gap-1"><PhoneCall className="h-3.5 w-3.5" aria-hidden="true" /> Call</span>
                <span className="inline-flex items-center gap-1"><MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" /> Chat</span>
                <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" aria-hidden="true" /> Video</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Free to download</span>
              </p>
            </div>

            <PhoneFan />
          </div>
        </div>
      </Container>
    </section>
  );
}
