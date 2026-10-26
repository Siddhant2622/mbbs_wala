import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { WebPImg } from '../lib/webp';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  avatar_url: string;
}

const avatars = [
  '/images/india/students.jpg',
  '/images/india/family-consult.jpg',
  '/images/india/doctors-group.jpg',
  '/images/india/doctor.jpg',
  '/images/india/counsel-meet.jpg',
  '/images/india/college-1.jpg',
  '/images/india/gmc.jpg',
  '/images/india/college-2.jpg',
];

function formatQuote(q: string) {
  return q.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-secondary">$1</strong>');
}

export default function Testimonials({ full }: { full?: boolean }) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!items.length || full) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5500);
    return () => clearInterval(t);
  }, [items, full]);

  if (loading) {
    return (
      <section className="premium-section section-cream">
        <div className="h-80 bg-white/50 rounded-[2rem] animate-pulse max-w-4xl mx-auto" />
      </section>
    );
  }
  if (!items.length) return null;

  if (full) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((t, i) => (
          <Card key={t.id} t={t} avatar={avatars[i % avatars.length]} />
        ))}
      </div>
    );
  }

  const t = items[idx];
  const avatar = t.avatar_url?.includes('mbbswala')
    ? t.avatar_url
    : avatars[idx % avatars.length];

  return (
    <section className="premium-section bg-white relative overflow-hidden">
      <div className="pointer-events-none absolute top-20 right-10 w-72 h-72 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-10 w-64 h-64 rounded-full bg-[#F97316]/10 blur-3xl" />

      <div className="text-center mb-14 relative z-10">
        <p className="eyebrow justify-center mb-4">Happy families</p>
        <h2 className="section-title text-4xl md:text-5xl lg:text-6xl mb-4 text-slate-900">
          Don&apos;t take our word for it
        </h2>
        <p className="text-slate-600 font-medium text-lg">Real stories from students MBBSWala guided</p>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="relative rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-gold to-primary" />
          <div className="grid md:grid-cols-[200px_1fr] min-h-[340px]">
            <div className="relative hidden md:block bg-slate-900 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={avatar}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <WebPImg
                    src={avatar}
                    alt={t.name}
                    className="w-full h-full object-cover opacity-90"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = avatars[0];
                    }}
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="font-bold text-white text-sm drop-shadow">{t.name}</p>
                {t.role && <p className="text-white/80 text-xs font-medium drop-shadow">{t.role}</p>}
              </div>
            </div>

            <div className="p-8 md:p-12 flex flex-col justify-center relative">
              <Quote className="absolute top-8 right-8 w-14 h-14 text-secondary/15" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  <p
                    className="text-xl md:text-2xl font-medium leading-relaxed text-slate-900 mb-8 relative z-10"
                    dangerouslySetInnerHTML={{ __html: formatQuote(t.quote) }}
                  />
                  <div className="flex items-center gap-4 md:hidden">
                    <WebPImg
                      src={avatar}
                      alt={t.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-secondary/20"
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{t.name}</p>
                      {t.role && <p className="text-sm text-slate-500 font-medium">{t.role}</p>}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
              className="w-12 h-12 rounded-full border border-slate-200 bg-white text-slate-900 grid place-items-center hover:bg-[#F97316] hover:border-[#F97316] hover:text-white transition-all"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % items.length)}
              className="w-12 h-12 rounded-full border border-slate-200 bg-white text-slate-900 grid place-items-center hover:bg-[#F97316] hover:border-[#F97316] hover:text-white transition-all"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? 'bg-secondary w-8' : 'bg-white/20 w-2 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <Link
            to="/testimonials"
            className="font-bold text-slate-700 hover:text-[#F97316] transition-colors underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>
      </div>
    </section>
  );
}

function Card({ t, avatar }: { t: Testimonial; avatar: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-7 flex flex-col justify-between min-h-[280px] shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_28px_60px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all duration-500">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary/80 to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Quote className="w-8 h-8 text-secondary/30 mb-3" />
      <p
        className="font-medium leading-relaxed mb-8 text-slate-800 flex-1"
        dangerouslySetInnerHTML={{ __html: formatQuote(t.quote) }}
      />
      <div className="flex items-center gap-3">
        <WebPImg
          src={t.avatar_url?.includes('mbbswala') ? t.avatar_url : avatar}
          alt={t.name}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover border-2 border-secondary/15"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = avatar;
          }}
        />
        <div>
          <p className="font-bold text-sm text-slate-900">{t.name}</p>
          {t.role && <p className="text-xs text-slate-500 font-medium">{t.role}</p>}
        </div>
      </div>
    </div>
  );
}
