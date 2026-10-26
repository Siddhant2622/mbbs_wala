import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BarChart3,
  Building2,
  FileText,
  Map,
  PlayCircle,
  ListChecks,
  ArrowRight,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { WebPImg } from '../lib/webp';

type FeatureConfig = {
  match: string;
  short: string;
  points: string[];
  icon: LucideIcon;
  image: string;
  cta: { label: string; to: string };
  fallbackTitle: string;
  fallbackDescription: string;
};

/** Site features — icons, images, CTAs & bullets (matched to API titles when present) */
const FEATURE_CONFIG: FeatureConfig[] = [
  {
    match: 'notification',
    short: 'Round alerts',
    fallbackTitle: 'Notifications',
    fallbackDescription:
      'Stay ahead with timely updates on counselling rounds, deadlines, seat matrix changes, and critical announcements — so you never miss a window.',
    points: [
      'Round-wise deadline reminders',
      'Seat matrix & notice alerts',
      'WhatsApp & call support on critical days',
    ],
    icon: Bell,
    image: '/images/mbbswala/feat-01-notify.jpg',
    cta: { label: 'Get updates', to: '/contact' },
  },
  {
    match: 'cut-off',
    short: 'Rank vs college',
    fallbackTitle: 'Cut-off Analysis',
    fallbackDescription:
      'Explore multi-year closing ranks across quotas and categories. Know which government and private colleges are realistic for your AIR.',
    points: [
      'AIQ + state rank bands',
      'Category-wise closing ranks',
      'MP & major state coverage',
    ],
    icon: BarChart3,
    image: '/images/mbbswala/feat-02-data.jpg',
    cta: { label: 'View cut-offs', to: '/cutoffs' },
  },
  {
    match: 'college',
    short: 'All India & State',
    fallbackTitle: 'Colleges',
    fallbackDescription:
      'Browse institute profiles with location, type, and counselling participation — India medical colleges in one directory.',
    points: [
      'State-wise India directory',
      'Govt & private filters',
    ],
    icon: Building2,
    image: '/images/india/college-1.jpg',
    cta: { label: 'Explore colleges', to: '/colleges' },
  },
  {
    match: 'fee',
    short: 'True cost',
    fallbackTitle: 'Fee, Stipend & Bonds',
    fallbackDescription:
      'Compare tuition, stipends, and service bond conditions before you lock a choice — so families plan finances without last-minute shocks.',
    points: [
      'Fee transparency guidance',
      'Bond & service terms explained',
      'Budget-fit shortlists',
    ],
    icon: FileText,
    image: '/images/mbbswala/feat-04-docs.jpg',
    cta: { label: 'Talk to expert', to: '/contact' },
  },
  {
    match: 'allotment',
    short: 'Seat chances',
    fallbackTitle: 'Allotment Mapping',
    fallbackDescription:
      'Simulate likely allotments using historical patterns mapped against your rank and category — plan AIQ vs state strategy with confidence.',
    points: [
      'Rank-band seat simulation',
      'AIQ vs state comparison',
      'Upgrade-round strategy tips',
    ],
    icon: Map,
    image: '/images/mbbswala/feat-05-map.jpg',
    cta: { label: 'Seat matrix', to: '/seat-matrix' },
  },
  {
    match: 'video',
    short: 'Process explainers',
    fallbackTitle: 'Video Guides',
    fallbackDescription:
      'Watch clear explainers on registration, choice filling, upgrades, and round strategy — so every family member is on the same page.',
    points: [
      'Choice-filling walkthroughs',
      'Document checklist videos',
      'Round strategy sessions',
    ],
    icon: PlayCircle,
    image: '/images/india/counsel-meet.jpg',
    cta: { label: 'Book a session', to: '/contact' },
  },
  {
    match: 'choice',
    short: 'Smart preferences',
    fallbackTitle: 'Choice List',
    fallbackDescription:
      'Build, prioritise, and refine your choice list with data-backed suggestions — reduce filling mistakes that cost a better seat.',
    points: [
      'Preference order guidance',
      'Safety / target / dream mix',
      'Expert review before lock',
    ],
    icon: ListChecks,
    image: '/images/mbbswala/feat-07-list.jpg',
    cta: { label: 'Book counselling', to: '/contact' },
  },
];

interface ApiFeature {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  sort_order?: number;
}

type DisplayFeature = {
  key: string;
  title: string;
  description: string;
  short: string;
  points: string[];
  icon: LucideIcon;
  image: string;
  cta: { label: string; to: string };
  badge: string;
};

function pickConfig(title: string): FeatureConfig {
  const t = title.toLowerCase();
  return (
    FEATURE_CONFIG.find((c) => t.includes(c.match)) ||
    FEATURE_CONFIG[FEATURE_CONFIG.length - 1]
  );
}

export default function Features() {
  const [apiFeatures, setApiFeatures] = useState<ApiFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetch('/api/features')
      .then((r) => r.json())
      .then((d) => setApiFeatures(Array.isArray(d) ? d : []))
      .catch(() => setApiFeatures([]))
      .finally(() => setLoading(false));
  }, []);

  const features: DisplayFeature[] = useMemo(() => {
    if (apiFeatures.length > 0) {
      return apiFeatures.map((af, i) => {
        const cfg = pickConfig(af.title);
        return {
          key: String(af.id),
          title: af.title || cfg.fallbackTitle,
          description: af.description || cfg.fallbackDescription,
          short: cfg.short,
          points: cfg.points,
          icon: cfg.icon,
          image: cfg.image,
          cta: cfg.cta,
          badge: String(i + 1).padStart(2, '0'),
        };
      });
    }
    // Fallback if API empty
    return FEATURE_CONFIG.map((cfg, i) => ({
      key: cfg.match,
      title: cfg.fallbackTitle,
      description: cfg.fallbackDescription,
      short: cfg.short,
      points: cfg.points,
      icon: cfg.icon,
      image: cfg.image,
      cta: cfg.cta,
      badge: String(i + 1).padStart(2, '0'),
    }));
  }, [apiFeatures]);

  useEffect(() => {
    if (active >= features.length) setActive(0);
  }, [features.length, active]);

  if (loading) {
    return (
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="h-10 w-48 bg-slate-200 rounded-full animate-pulse mx-auto mb-6" />
          <div className="h-12 w-80 max-w-full bg-slate-200 rounded-2xl animate-pulse mx-auto mb-12" />
          <div className="grid md:grid-cols-[220px_1fr] gap-5">
            <div className="hidden md:flex flex-col gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-14 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-[420px] bg-slate-200 rounded-[1.75rem] animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (!features.length) return null;

  const f = features[Math.min(active, features.length - 1)];
  const Icon = f.icon;

  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-slate-50" id="features">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F97316] mb-3">
            Features
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 leading-tight">
            Everything you need for{' '}
            <span className="italic text-[#F97316]">smarter counselling</span>
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg">
            From notifications to choice lists — the full toolkit families use during NEET counselling.
          </p>
        </div>

        {/* Desktop / tablet */}
        <div className="hidden md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[248px_1fr] gap-5 lg:gap-6 items-stretch">
          <div className="flex flex-col gap-1.5">
            {features.map((feat, i) => {
              const TabIcon = feat.icon;
              const isOn = active === i;
              return (
                <button
                  key={feat.key}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`group flex items-center gap-3 text-left px-3.5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                    isOn
                      ? 'bg-slate-900 text-white shadow-[0_12px_28px_rgba(14,17,23,0.18)]'
                      : 'bg-white text-slate-800 border border-slate-200 hover:border-[#F97316]/40 hover:bg-orange-50'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-colors ${
                      isOn
                        ? 'bg-[#F97316] text-white'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-orange-100'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" strokeWidth={2.25} />
                  </span>
                  <span className="leading-tight min-w-0">
                    <span className="block truncate">{feat.title}</span>
                    <span
                      className={`block text-[11px] font-medium mt-0.5 ${
                        isOn ? 'text-white/70' : 'text-slate-500'
                      }`}
                    >
                      {feat.short}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative min-h-[420px] lg:min-h-[480px] rounded-[1.75rem] overflow-hidden border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={f.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className="grid lg:grid-cols-2 h-full min-h-[420px] lg:min-h-[480px]"
              >
                <div className="flex flex-col justify-center p-7 lg:p-10 xl:p-12 order-2 lg:order-1 bg-white text-slate-900">
                  <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-[11px] font-bold uppercase tracking-wider text-orange-700 mb-5">
                    <Icon className="w-3.5 h-3.5" />
                    Feature {f.badge}
                  </div>
                  <h3 className="font-display text-3xl xl:text-4xl font-bold mb-3 leading-tight text-slate-900">
                    {f.title}
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed mb-6 text-[15px]">
                    {f.description}
                  </p>
                  <ul className="space-y-2.5 mb-8">
                    {f.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-2.5 text-sm font-semibold text-slate-800"
                      >
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[#F97316]/15 grid place-items-center shrink-0">
                          <Check className="w-3 h-3 text-[#F97316]" strokeWidth={3} />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={f.cta.to}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white text-sm font-bold transition-colors shadow-lg shadow-orange-500/25"
                    >
                      {f.cta.label}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-900 text-sm font-bold transition-colors"
                    >
                      Talk to expert
                    </Link>
                  </div>
                </div>

                <div className="relative order-1 lg:order-2 min-h-[240px] lg:min-h-full overflow-hidden bg-white/5">
                  <WebPImg
                    src={f.image}
                    alt={f.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1117]/35 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:to-[#0E1117]/15" />
                  <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-xs font-bold text-slate-900 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
                      MBBSWala · {f.short}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
            {features.map((feat, i) => {
              const TabIcon = feat.icon;
              const isOn = active === i;
              return (
                <button
                  key={feat.key}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`snap-start shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    isOn
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {feat.title}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-[16/10] relative">
                <WebPImg src={f.image} alt={f.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 left-3 text-[11px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur px-2.5 py-1 rounded-full">
                  Feature {f.badge}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-9 h-9 rounded-xl bg-[#F97316]/15 grid place-items-center">
                    <Icon className="w-4 h-4 text-[#F97316]" />
                  </span>
                  <h3 className="font-display text-2xl font-bold text-slate-900">{f.title}</h3>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
                  {f.description}
                </p>
                <ul className="space-y-2 mb-5">
                  {f.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-sm font-semibold text-slate-800"
                    >
                      <Check
                        className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5"
                        strokeWidth={2.5}
                      />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <Link
                    to={f.cta.to}
                    className="zn-cta zn-cta-primary w-full justify-center gap-2 text-sm"
                  >
                    {f.cta.label} <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/contact" className="zn-cta w-full justify-center text-sm">
                    Talk to expert
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-1.5 mt-5">
            {features.map((feat, i) => (
              <button
                key={feat.key}
                type="button"
                onClick={() => setActive(i)}
                aria-label={feat.title}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? 'w-6 bg-[#F97316]' : 'w-1.5 bg-white/25'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
