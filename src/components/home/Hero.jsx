import Image from 'next/image';
import Container from '@/components/ui/Container';
import SearchBar from './SearchBar';
import { CATEGORIES } from '@/data/categories';

export default function Hero() {
  const popular = CATEGORIES.slice(0, 5);

  return (
    <section className="relative overflow-hidden bg-[#0F172A] text-white py-14 sm:py-20 lg:py-28 border-b border-[#0F172A]">
      {/* Banner background image — shown full */}
      <Image
        src="/banner5.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-center"
      />
      {/* Light left-weighted overlay: keeps the white text readable while the
          image stays clearly visible, especially on the right. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0F172A]/85 via-[#0F172A]/45 to-[#0F172A]/10" />

      <Container className="relative z-10">
        <div className="flex max-w-2xl flex-col items-start text-left">
          {/* Top Indicator */}
          <div className="animate-fade-up inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-3.5 py-1 text-xs font-medium tracking-wide text-[#D4AF37] mb-4 sm:mb-6 backdrop-blur-sm">
            <span>🇮🇳</span> India&apos;s Advocate Directory Platform
          </div>

          {/* Heading — LCP element, renders instantly */}
          <h1 className="font-display text-[2rem] font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.15] drop-shadow-lg">
            Find Verified Advocates <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E7C766] to-[#D4AF37]">
              Across India
            </span>
          </h1>

          {/* Secondary Paragraph */}
          <p
            className="animate-fade-up mt-4 max-w-xl text-sm sm:text-lg text-slate-200 leading-relaxed font-normal drop-shadow"
            style={{ animationDelay: '0.1s' }}
          >
            Search, compare, and connect with trusted advocates by legal service, city,
            language, and experience — all in one place.
          </p>

          {/* Search Bar */}
          <div className="animate-fade-up w-full mt-6 sm:mt-9" style={{ animationDelay: '0.15s' }}>
            <div className="p-2 rounded-2xl border border-white/10 shadow-2xl">
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
        </div>
      </Container>
    </section>
  );
}
