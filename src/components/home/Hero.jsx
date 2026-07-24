import Image from 'next/image';
import { ShieldCheck, BadgeCheck, Lock } from 'lucide-react';
import Container from '@/components/ui/Container';
import SearchBar from './SearchBar';
import { CATEGORIES } from '@/data/categories';

const TRUST = [
  { icon: ShieldCheck, label: '100% Anonymous' },
  { icon: BadgeCheck, label: 'Verified Lawyers' },
  { icon: Lock, label: 'Secure & Confidential' },
];

export default function Hero() {
  const popular = CATEGORIES.slice(0, 5);

  // The chip that used to sit above the title was also what pushed the heading
  // clear of the header — with it gone, the section's top padding carries that
  // job on its own.
  return (
    <section className="relative overflow-hidden bg-[#0F172A] text-white pt-24 pb-14 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-28 border-b border-[#0F172A]">
      {/* Banner background image — shown full */}
      <Image
        src="/banner-3.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-center brightness-[0.7]"
      />
      {/* Dark, on-theme overlay: deep navy across the whole image (heavier on the
          left where the text sits) so the hero reads as one dark themed block. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0F172A]/85 via-[#0F172A]/60 to-[#0F172A]/40" />

      <Container className="relative z-10">
        <div className="flex max-w-3xl flex-col items-start text-left">
          {/* Heading — LCP element, renders instantly */}
          <h1 className="font-display text-[1.9rem] font-extrabold tracking-tight sm:text-[2.3rem] lg:text-[2.9rem] leading-[1.12] drop-shadow-lg">
            <span className="sm:whitespace-nowrap">Get Anonymous Legal Assistance</span>{' '}
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E7C766] to-[#D4AF37]">
              From Verified Lawyers
            </span>
          </h1>

          {/* Secondary Paragraph */}
          <p
            className="animate-fade-up mt-4 max-w-xl text-sm sm:text-lg text-slate-200 leading-relaxed font-normal drop-shadow"
            style={{ animationDelay: '0.1s' }}
          >
            Consult verified lawyers for family, property, criminal and more—while keeping your identity completely anonymous.
          </p>

          {/* Search Bar */}
          <div className="animate-fade-up w-full max-w-2xl mt-4 sm:mt-5" style={{ animationDelay: '0.15s' }}>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-1.5 shadow-2xl backdrop-blur-md">
              <SearchBar />
            </div>

            {/* Popular Specializations Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="font-semibold text-[#D4AF37]/90 tracking-wide uppercase text-[11px]">Popular:</span>
              {popular.length > 0 ? (
                popular.map((c) => (
                  <a
                    key={c.slug}
                    href={`/legal-services/${c.slug}`}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-100 font-medium backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#D4AF37]/60 hover:text-white shadow-sm"
                  >
                    {c.name}
                  </a>
                ))
              ) : (
                ['Civil Law', 'Criminal Law', 'Family Law', 'Property Law', 'Corporate Law'].map((name) => (
                  <span key={name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-100 font-medium shadow-sm">
                    {name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Trust strip — reassurance cues, spaced clear of the search block. */}
          <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: '0.2s' }}>
            {TRUST.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Icon className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
