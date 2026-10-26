import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Globe2, GraduationCap, ArrowUpRight } from 'lucide-react';
import { WebPImg } from '../lib/webp';

const points = [
  'Government and private medical colleges across India',
  'All India seats, state quota, deemed and central colleges',
  'Full help: shortlist → papers → final admission',
];

export default function AppPromo() {
  return (
    <section className="premium-section relative overflow-hidden bg-white">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <p className="eyebrow justify-center mb-4">MBBS in India</p>
          <h2 className="section-title text-4xl md:text-5xl lg:text-6xl mb-5 text-slate-900">
            Help you can trust{' '}
            <span className="zn-highlight green">for Indian MBBS seats</span>
          </h2>
          <p className="text-slate-600 font-medium max-w-xl mx-auto text-lg leading-relaxed">
            From All India counselling to your state list — one team stays with you until the seat is confirmed.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-secondary/15 to-primary/15 rounded-[2rem] blur-2xl opacity-70" />
            <div className="relative img-zoom rounded-[1.75rem] overflow-hidden shadow-2xl border border-black/5 aspect-[16/11]">
              <WebPImg
                src="/images/india/college-1.jpg"
                alt="Indian medical college campus"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -right-3 sm:right-6 rounded-2xl bg-white border border-slate-200 shadow-xl px-4 py-3 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white grid place-items-center text-sm font-black">
                ✓
              </span>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Seat options</p>
                <p className="font-bold text-slate-900 text-sm">All India + State + Deemed</p>
              </div>
            </div>
          </motion.div>

          <div>
            <div className="flex flex-wrap gap-2.5 mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg">
                <GraduationCap className="w-4 h-4" /> Govt MBBS
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F97316] text-white text-xs font-bold shadow-lg shadow-orange-500/25">
                <Globe2 className="w-4 h-4" /> Private & Deemed
              </span>
            </div>
            <ul className="space-y-4 mb-10">
              {points.map((p, i) => (
                <motion.li
                  key={p}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 font-semibold text-slate-800 text-[15px] md:text-base"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                  {p}
                </motion.li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link to="/colleges" className="zn-cta zn-cta-primary gap-2">
                Browse colleges <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link to="/contact" className="zn-cta gap-2">
                Talk to counsellor
              </Link>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] night-band p-8 md:p-12 grain">
          <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 bg-[#D4B08C]/12 blur-[80px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left max-w-md">
              <h3 className="font-display text-3xl md:text-4xl mb-3 tracking-tight text-[#F7F2EA]">
                Join families who chose MBBSWala
              </h3>
              <p className="text-[#F7F2EA]/60 font-medium leading-relaxed">
                Talk to mentors and a counselling team that has helped thousands of students get medical seats.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                { n: '10+', l: 'Years' },
                { n: '8k+', l: 'Admissions' },
                { n: '200+', l: 'Tie-ups' },
              ].map((s) => (
                <div
                  key={s.l}
                  className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl px-7 py-5 text-center min-w-[110px] hover:bg-white/[0.1] transition-colors"
                >
                  <p className="stat-value text-3xl md:text-4xl font-medium text-[#F7F2EA]">{s.n}</p>
                  <p className="stat-label text-[11px] uppercase tracking-[0.16em] text-[#D4B08C]/80 mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
