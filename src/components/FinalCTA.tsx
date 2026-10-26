import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import Magnetic from './Magnetic';
import { WebPImg } from '../lib/webp';

/**
 * Closing chapter — night editorial palette:
 * deep slate · orange accent · pure white type · soft glass pills
 */
export default function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '10%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.06, 1, 1.04]);

  return (
    <section
      ref={ref}
      className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden min-h-[min(72vh,820px)] flex items-center night-band"
    >
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <WebPImg
          src="/images/india/gmc.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
      </motion.div>

      {/* Soft night veil — slate navy, no electric blue */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#121820]/92 via-[#161d28]/94 to-[#0f141c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_20%,rgba(212,176,140,0.12),transparent_60%)]" />
      <div className="absolute inset-0 grain" />

      <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
        <p className="eyebrow-night justify-center mb-6">Ready when you are</p>

        <h2 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-[4.25rem] tracking-tight mb-8 sm:mb-10 leading-[1.08] text-white">
          Medical admission help{' '}
          <span className="italic pr-1 font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#FDBA74] via-[#F97316] to-[#FB923C]">
            families trust
          </span>
        </h2>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12">
          {['Real cut-off data', 'Live counsellor support', 'All India & state seats'].map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-2.5 font-semibold text-[#F7F2EA]/88 text-sm md:text-[15px] px-4 py-2.5 rounded-full border border-white/[0.12] bg-white/[0.06] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] grid place-items-center shrink-0 shadow-[0_0_12px_rgba(249,115,22,0.35)]">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </span>
              {t}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
          <Magnetic strength={0.18}>
            <Link to="/contact" className="btn-orange text-base md:text-lg px-10 py-4 gap-2 inline-flex">
              Get started <ArrowRight className="w-5 h-5" />
            </Link>
          </Magnetic>
          <Link
            to="/seat-matrix"
            className="inline-flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base md:text-lg font-semibold text-[#F7F2EA] border border-white/18 bg-white/[0.04] hover:bg-white/[0.1] transition-colors backdrop-blur-sm"
          >
            View seat matrix
          </Link>
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="absolute -inset-6 bg-gradient-to-r from-[#D4B08C]/15 via-transparent to-[#F97316]/12 blur-3xl rounded-[2rem]" />
          <WebPImg
            src="/images/mbbswala/feat-02-data.jpg"
            alt="MBBSWala counselling tools"
            className="relative mx-auto w-full rounded-2xl border border-white/12 shadow-[0_30px_80px_rgba(0,0,0,0.45)] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
