


'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, ShieldCheck, Users } from 'lucide-react';
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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0C5E57] via-[#0C5E57] to-[#021c19] text-white py-16 lg:py-24 border-b border-emerald-950">
      {/* Background Subtle Watermark/Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
      
      {/* Soft Glow Ambient Lighting */}
      <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[350px] h-[350px] bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side Column: Content & Search Form */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Top Indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3.5 py-1 text-xs font-medium tracking-wide text-emerald-400 mb-6 backdrop-blur-sm"
            >
              <span>🇮🇳</span> India&apos;s Advocate Directory Platform
            </motion.div>

            {/* Dynamic Typography Heading */}
            <motion.h1
              className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.15]"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              Find Verified Advocates <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                Across India
              </span>
            </motion.h1>

            {/* Clean Secondary Paragraph */}
            <motion.p
              className="mt-6 max-w-xl text-base sm:text-lg text-emerald-100/70 leading-relaxed font-normal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Search, compare, and connect with trusted advocates by legal service, city, 
              language, and experience — all in one place.
            </motion.p>

            {/* Integrated Search Bar Section */}
            <motion.div
              className="w-full mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            >
              {/* Premium Inner Form Background Accent */}
              <div className="p-2 bg-[#03201c] rounded-2xl border border-emerald-900/60 shadow-2xl">
                <SearchBar />
              </div>

              {/* Popular Specializations Tags */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="font-semibold text-emerald-400/70 tracking-wide uppercase text-[11px]">Popular:</span>
                {popular.length > 0 ? (
                  popular.map((c) => (
                    <a
                      key={c.slug}
                      href={`/legal-services/${c.slug}`}
                      className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-1.5 text-emerald-200 font-medium transition-all hover:bg-emerald-800/40 hover:border-emerald-500 hover:text-white shadow-sm"
                    >
                      {c.name}
                    </a>
                  ))
                ) : (
                  ['Civil Law', 'Criminal Law', 'Family Law', 'Property Law', 'Corporate Law'].map((name) => (
                    <span key={name} className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-1.5 text-emerald-200 font-medium shadow-sm">
                      {name}
                    </span>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Side Column: Modern Graphic/Trust Stats Panel */}
          <div className="hidden lg:block lg:col-span-5 relative pl-6">
            <motion.div 
              className="relative mx-auto w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Decorative Subtle Pillars Accent Box */}
              <div className="absolute inset-0 -m-4 bg-emerald-900/10 border border-emerald-500/5 rounded-3xl pointer-events-none" />

              {/* Premium Stats Stack Box */}
              <div className="relative bg-white rounded-2xl p-8 border border-emerald-800/50 shadow-2xl space-y-6">
                
                {/* Header Meta Info */}
                <div className="flex items-center justify-between border-b border-emerald-900 pb-4">
                  <div>
                    <h3 className="text-sm font-bold tracking-wide text-[#0C5E57] uppercase">Legal Care India</h3>
                    <p className="text-xs text-black mt-0.5">National Advocate Registry</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Vertical Trust Rows */}
                <div className="space-y-4">
                  {TRUST.map(({ icon: Icon, label }) => (
                    <div 
                      key={label} 
                      className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-100 border border-[#0C5E57] hover:border-emerald-800/60 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0C5E57] text-white border border-emerald-500/20 shadow-inner">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-semibold tracking-wide text-black">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Mini Metric Highlight */}
                <div className="pt-2">
                  <div className="rounded-xl bg-[#0C5E57] p-4">
                    <p className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">Verification Standards</p>
                    <p className="text-xl font-bold mt-1 text-white tracking-tight">100% Bar Council Verified</p>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

        </div>
      </Container>
    </section>
  );
}