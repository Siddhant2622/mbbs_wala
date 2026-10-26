import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { WebPImg } from '../lib/webp';

const tools = [
  {
    title: 'Rank → colleges',
    desc: 'Predict rank and get Safe / Moderate / Reach shortlists.',
    path: '/rank-calculator',
    img: '/images/india/doctor.jpg',
  },
  {
    title: 'Compare colleges',
    desc: 'Seats, AIQ cutoffs and category bands side-by-side.',
    path: '/compare',
    img: '/images/india/college-1.jpg',
  },
  {
    title: 'Seat matrix',
    desc: 'Government & private seat counts you can filter fast.',
    path: '/seat-matrix',
    img: '/images/india/gmc.jpg',
  },
  {
    title: 'Cut-offs',
    desc: 'Past closing ranks by category for planning choices.',
    path: '/cutoffs',
    img: '/images/india/students.jpg',
  },
];

export default function MbbsWalaTools() {
  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-slate-50 border-y border-slate-200/80">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 max-w-lg mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F97316] mb-3">
            Tools that decide seats
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Meaningful outcomes, not empty tables
          </h2>
          <p className="text-slate-600 font-medium">
            Predict, match, compare — then talk to a counsellor when you are ready.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {tools.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.1)] hover:border-[#F97316]/40"
            >
              <div className="relative h-36 overflow-hidden">
                <WebPImg
                  src={t.img}
                  alt=""
                  width={400}
                  height={144}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
              </div>
              <div className="p-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{t.title}</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{t.desc}</p>
                </div>
                <span className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-[#F97316] text-slate-900 group-hover:text-white grid place-items-center shrink-0 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-white border border-slate-200 text-slate-900 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-slate-900">How families win</h3>
            <p className="text-slate-600 font-medium text-sm sm:text-base max-w-md">
              Score → rank band → matched colleges → compare top 2 → book counselling.
            </p>
          </div>
          <Link to="/contact" className="btn-orange px-7 py-3.5 text-sm shrink-0 text-center">
            Book counselling
          </Link>
        </div>
      </div>
    </section>
  );
}
