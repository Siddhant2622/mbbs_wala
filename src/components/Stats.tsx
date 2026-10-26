import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface Stat {
  id: number;
  prefix?: string;
  suffix: string;
  label: string;
  numeric_value: number;
}

function CountUp({ to, suffix, prefix = '' }: { to: number; suffix: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {prefix}{val.toLocaleString()}
      {suffix}
    </span>
  );
}

const FALLBACK_STATS = [
  { id: 1, numeric_value: 10, suffix: '+', label: 'Years Consultancy' },
  { id: 2, numeric_value: 8000, suffix: '+', label: 'Successful Admissions' },
  { id: 3, numeric_value: 200, suffix: '+', label: 'College Tie-ups' },
  { id: 4, numeric_value: 25, suffix: '+', label: 'Indian States Covered' },
];

export default function Stats() {
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => {
        if (!r.ok) throw new Error('API failed');
        return r.json();
      })
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          const parsed = d.slice(0, 4).map((s: any) => {
            if (s.value && s.numeric_value === undefined) {
               const strVal = String(s.value).replace(/,/g, '');
               const numMatch = strVal.match(/[\d.]+/);
               const num = numMatch ? parseFloat(numMatch[0]) : 0;
               const numStr = numMatch ? numMatch[0] : '';
               const prefix = String(s.value).substring(0, String(s.value).replace(/,/g, '').indexOf(numStr));
               // getting the suffix is easier: remove prefix and number string
               // wait, commas were removed for numMatch, so just extract from original using regex
               const origMatch = String(s.value).match(/([\D]*)([\d.,]+)([\D]*)/);
               return {
                 ...s,
                 numeric_value: origMatch ? parseFloat(origMatch[2].replace(/,/g, '')) : 0,
                 prefix: origMatch ? origMatch[1] : '',
                 suffix: origMatch ? origMatch[3] : String(s.value)
               };
            }
            return s;
          });
          setStats(parsed);
        } else {
          setStats(FALLBACK_STATS);
        }
      })
      .catch(() => setStats(FALLBACK_STATS));
  }, []);

  if (!stats.length) {
    return (
      <section className="py-12 px-4 bg-white border-y border-slate-200">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 sm:py-16 px-4 sm:px-6 bg-white border-y border-slate-200">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
        {stats.map((s) => (
          <div key={s.id} className="text-center">
            <p className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-none mb-2">
              <CountUp to={s.numeric_value} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-snug">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
