import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const words = ['NEET UG', 'NEET PG', 'State seats'];

/**
 * High-performance Hero:
 * Zero-runtime CSS animations, responsive WebP LCP image,
 * and zero framer-motion dependencies to eliminate forced reflows and render delays.
 */
export default function Hero() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const { theme } = useTheme();
  const light = theme === 'light';

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % words.length);
        setFade(true);
      }, 180);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-[min(88svh,860px)] flex flex-col items-center justify-center overflow-hidden bg-[#0B0D12] text-white"
    >
      {/* College photo background — WebP for modern browsers, JPG fallback */}
      <picture className="absolute inset-0 w-full h-full">
        <source
          media="(max-width: 768px)"
          type="image/webp"
          srcSet="/images/mbbswala/hero-warm-mobile.webp"
        />
        <source
          type="image/webp"
          srcSet="/images/mbbswala/hero-warm.webp"
        />
        <img
          src="/images/mbbswala/hero-warm.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          width={1200}
          height={627}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/mbbswala/hero-main.jpg';
          }}
        />
      </picture>

      {/* Readable dark overlays */}
      <div className="absolute inset-0 bg-[#0B0D12]/72" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-[#0B0D12]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(249,115,22,0.18) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 xs:px-5 sm:px-8 pt-[max(7rem,calc(env(safe-area-inset-top)+5.5rem))] sm:pt-28 pb-16 sm:pb-20 text-center">
        <p className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border border-white/15 bg-white/[0.07] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-white/85 mb-6 sm:mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#FDBA74]" />
          Stress-free medical admissions
        </p>

        <h1 className="font-sans font-black text-[2.25rem] xs:text-[2.6rem] sm:text-5xl md:text-6xl leading-[1.08] tracking-[-0.03em] mb-5 sm:mb-6">
          <span className="block text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
            Your clear path through
          </span>
          <span className="mt-1 sm:mt-2 block min-h-[1.15em]">
            <span
              className={`inline-block text-[#FDBA74] transition-all duration-200 transform ${
                fade ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
              }`}
            >
              {words[idx]}
            </span>
            <span className="text-white"> counselling</span>
          </span>
        </h1>

        <p className="text-[15px] sm:text-lg text-white/72 font-medium max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10">
          Cut-offs, seat lists and real counsellors — so your family chooses with
          confidence.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md sm:max-w-none mx-auto">
          <Link
            to="/contact"
            className="btn-orange px-8 sm:px-10 py-3.5 text-[15px] sm:text-base inline-flex items-center gap-2 w-full sm:w-auto justify-center touch-manipulation"
          >
            Book free call <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/colleges"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/25 bg-white/[0.06] backdrop-blur-md text-white font-semibold hover:bg-white/12 transition-colors w-full sm:w-auto touch-manipulation"
          >
            Browse colleges
          </Link>
        </div>

        <div className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-x-6 sm:gap-x-8 gap-y-2 text-xs sm:text-sm font-semibold text-white/50">
          <span className="text-white/70">10+ years</span>
          <span className="hidden sm:inline opacity-30">·</span>
          <span className="text-white/70">8,000+ admissions</span>
          <span className="hidden sm:inline opacity-30">·</span>
          <span className="text-white/70">200+ colleges</span>
        </div>
      </div>

      {/* soft blend into ChoiceFinder section */}
      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t to-transparent ${
          light ? 'from-white via-white/80' : 'from-[#0B0D12] via-[#0B0D12]/80'
        }`}
      />
    </section>
  );
}
