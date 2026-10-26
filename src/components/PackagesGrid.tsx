import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { StaggerReveal, staggerItem } from './ScrollReveal';
import { WebPImg } from '../lib/webp';

interface Pkg {
  id: number;
  name: string;
  slug: string;
  price: number;
  price_label: string;
  description: string;
  color: string;
  illustration: string;
  features: string[];
}

/* Unified brand accents — only ink + teal + coral variations */
const accents: Record<string, { gradient: string; glow: string; badge: string }> = {
  violet: {
    gradient: 'from-[#0c1222] via-[#0f2a2a] to-[#0f766e]',
    glow: 'bg-[#F97316]/25',
    badge: 'bg-[#F97316]/15 text-orange-50 border-[#F97316]/25',
  },
  orange: {
    gradient: 'from-[#0c1222] via-[#1a1a1a] to-[#9a3412]',
    glow: 'bg-orange-500/25',
    badge: 'bg-orange-400/15 text-orange-50 border-orange-300/20',
  },
  brown: {
    gradient: 'from-[#0c1222] via-[#132a28] to-[#0f766e]',
    glow: 'bg-[#F97316]/20',
    badge: 'bg-[#F97316]/15 text-orange-50 border-[#F97316]/25',
  },
  red: {
    gradient: 'from-[#0c1222] via-[#1c1917] to-[#c2410c]',
    glow: 'bg-orange-500/20',
    badge: 'bg-orange-400/15 text-orange-50 border-orange-300/20',
  },
  green: {
    gradient: 'from-[#0c1222] via-[#0f3d3a] to-[#0f766e]',
    glow: 'bg-[#F97316]/30',
    badge: 'bg-[#F97316]/15 text-orange-50 border-[#F97316]/25',
  },
  blue: {
    gradient: 'from-[#0c1222] via-[#0f2929] to-[#115e59]',
    glow: 'bg-[#F97316]/25',
    badge: 'bg-[#F97316]/15 text-orange-50 border-[#F97316]/25',
  },
};

const illMap: Record<string, string> = {
  'neet-ug': '/images/mbbswala/pkg-steth.jpg',
  'neet-pg': '/images/mbbswala/pkg-heart.jpg',
  'neet-mds': '/images/mbbswala/pkg-dental.jpg',
  inicet: '/images/mbbswala/obj-stethoscope.png',
  'dnb-pdcet': '/images/mbbswala/feat-02-data.jpg',
  'neet-ss': '/images/mbbswala/feat-05-map.jpg',
};

export default function PackagesGrid({ limit }: { limit?: number }) {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/packages')
      .then((r) => r.json())
      .then((d) => setPackages(Array.isArray(d) ? d : []))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const list = limit ? packages.slice(0, limit) : packages;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 sm:h-72 bg-ink/5 rounded-[1.75rem] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <StaggerReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6" stagger={0.07}>
      {list.map((pkg) => {
        const a = accents[pkg.color] || accents.blue;
        return (
          <motion.div key={pkg.id} variants={staggerItem}>
            <Link
              to="/login"
              className={`group relative flex flex-col min-h-[260px] sm:min-h-[300px] overflow-hidden rounded-2xl sm:rounded-[1.75rem] bg-gradient-to-br ${a.gradient} force-white border border-white/10 shadow-[0_24px_60px_rgba(12,18,34,0.18)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_80px_rgba(12,18,34,0.28)] touch-manipulation`}
            >
              <div className={`pointer-events-none absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity ${a.glow}`} />
              <WebPImg
                src={illMap[pkg.slug] || '/images/mbbswala/pkg-steth.jpg'}
                alt=""
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                className="absolute bottom-0 right-0 w-40 h-40 object-cover opacity-70 group-hover:opacity-90 group-hover:scale-110 transition-all duration-700 rounded-tl-[2rem] drop-shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="relative z-10 p-6 md:p-7 flex flex-col h-full">
                <span className={`self-start inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full border ${a.badge} mb-5`}>
                  <Sparkles className="w-3 h-3" /> Package
                </span>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2 pr-16 force-white drop-shadow-sm">{pkg.name}</h3>
                <p className="stat-value text-4xl md:text-5xl tracking-tight mb-auto font-medium force-white">
                  {pkg.price === 0 ? (
                    <span className="italic pr-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#FDBA74]">Free</span>
                  ) : (
                    <>
                      <span className="text-lg align-top opacity-70 mr-0.5">₹</span>
                      {(pkg.price_label || pkg.price.toLocaleString('en-IN')).toString().replace('₹', '')}
                    </>
                  )}
                </p>
                <span className="pkg-learn-more mt-8 inline-flex items-center gap-2 self-start rounded-full bg-white pl-5 pr-1.5 py-1.5 text-sm font-bold shadow-lg group-hover:gap-3 transition-all text-black">
                  Learn more
                  <span className="pkg-learn-icon w-9 h-9 rounded-full grid place-items-center shrink-0">
                    <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                  </span>
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </StaggerReveal>
  );
}
