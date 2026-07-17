import { BadgeCheck, ShieldCheck, Users, Scale, Gavel, Landmark } from 'lucide-react';
import Container from '@/components/ui/Container';
import SearchBar from './SearchBar';
import { CATEGORIES } from '@/data/categories';

const TRUST = [
  { icon: BadgeCheck, label: 'Verified Advocates' },
  { icon: ShieldCheck, label: 'Trusted Reviews' },
  { icon: Users, label: '1.2 Lakh+ Clients Helped' },
];

export default function Hero() {
  const popular = CATEGORIES.slice(0, 5);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F] to-[#0F172A] text-white py-10 sm:py-14 lg:py-24 border-b border-[#0F172A]">
      {/* Background Subtle Watermark/Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

      {/* Legal-themed backdrop motifs — the hero's "image" layer, drawn in the
          brand colors so it blends with the dark theme. */}
      <Landmark className="pointer-events-none absolute -right-16 top-1/2 hidden h-[34rem] w-[34rem] -translate-y-1/2 text-[#D4AF37]/[0.05] lg:block" aria-hidden="true" />
      <Scale className="pointer-events-none absolute -left-12 top-8 h-72 w-72 rotate-12 text-white/[0.035]" aria-hidden="true" />
      <Gavel className="pointer-events-none absolute bottom-2 left-1/3 hidden h-52 w-52 -rotate-12 text-[#D4AF37]/[0.06] sm:block" aria-hidden="true" />

      {/* Soft Glow Ambient Lighting */}  
      <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-[#D4AF37]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[350px] h-[350px] bg-[#34557F]/20 blur-[100px] rounded-full pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side Column: Content & Search Form */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Top Indicator */}
            <div className="animate-fade-up inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-3.5 py-1 text-xs font-medium tracking-wide text-[#D4AF37] mb-4 sm:mb-6 backdrop-blur-sm">
              <span>🇮🇳</span> India&apos;s Advocate Directory Platform
            </div>

            {/* Dynamic Typography Heading — LCP element, renders instantly */}
            <h1 className="font-display text-[2rem] font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.15]">
              Find Verified Advocates <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E7C766] to-[#D4AF37]">
                Across India
              </span>
            </h1>

            {/* Clean Secondary Paragraph */}
            <p
              className="animate-fade-up mt-4 max-w-xl text-sm sm:text-lg text-slate-300 leading-relaxed font-normal"
              style={{ animationDelay: '0.1s' }}
            >
              Search, compare, and connect with trusted advocates by legal service, city,
              language, and experience — all in one place.
            </p>

            {/* Integrated Search Bar Section */}
            <div
              className="animate-fade-up w-full mt-6 sm:mt-9"
              style={{ animationDelay: '0.15s' }}
            >
              {/* Premium Inner Form Background Accent */}
              <div className="p-2 rounded-2xl border border-white/10 shadow-2xl">
                <SearchBar />
              </div>

              {/* Popular Specializations Tags */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="font-semibold text-[#D4AF37]/80 tracking-wide uppercase text-[11px]">Popular:</span>
                {popular.length > 0 ? (
                  popular.map((c) => (
                    <a
                      key={c.slug}
                      href={`/legal-services/${c.slug}`}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 font-medium transition-all hover:bg-white/10 hover:border-[#D4AF37]/60 hover:text-white shadow-sm"
                    >
                      {c.name}
                    </a>
                  ))
                ) : (
                  ['Civil Law', 'Criminal Law', 'Family Law', 'Property Law', 'Corporate Law'].map((name) => (
                    <span key={name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 font-medium shadow-sm">
                      {name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Side Column: Modern Graphic/Trust Stats Panel */}
          <div className="hidden lg:block lg:col-span-5 relative pl-6">
            <div
              className="animate-fade-up relative mx-auto w-full max-w-md"
              style={{ animationDelay: '0.2s' }}
            >
              {/* Decorative Subtle Pillars Accent Box */}
              <div className="absolute inset-0 -m-4 bg-white/5 border border-[#D4AF37]/10 rounded-3xl pointer-events-none" />

              {/* Premium Stats Stack Box — matches the site's dark theme */}
              <div className="relative space-y-6 rounded-2xl border border-white/10 bg-[#0F1A2E]/80 p-8 shadow-2xl backdrop-blur-sm">

                {/* Header Meta Info */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-[#D4AF37]">Legal Care India</h3>
                    <p className="mt-0.5 text-xs text-slate-300">National Advocate Registry</p>
                  </div>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#D4AF37]" />
                </div>

                {/* Vertical Trust Rows */}
                <div className="space-y-4">
                  {TRUST.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3.5 transition-colors hover:border-[#D4AF37]/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#1E3A5F] text-[#D4AF37] shadow-inner">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-semibold tracking-wide text-white">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Mini Metric Highlight */}
                <div className="pt-2">
                  <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#D4AF37]">Verification Standards</p>
                    <p className="mt-1 text-xl font-bold tracking-tight text-white">100% Bar Council Verified</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}