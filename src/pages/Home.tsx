import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import ChoiceFinder from '../components/ChoiceFinder';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import PromoBannerPopup from '../components/PromoBannerPopup';

// Lazy-load all below-fold sections to reduce initial JS parse time
// This cuts the critical path JS by ~50%, reducing LCP render delay
const Stats       = lazy(() => import('../components/Stats'));
const MbbsWalaTools = lazy(() => import('../components/MbbsWalaTools'));
const PainPoints  = lazy(() => import('../components/PainPoints'));
const Explainer   = lazy(() => import('../components/Explainer'));
const Features    = lazy(() => import('../components/Features'));
const PackagesGrid = lazy(() => import('../components/PackagesGrid'));
const Support     = lazy(() => import('../components/Support'));
const AppPromo    = lazy(() => import('../components/AppPromo'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const FAQ         = lazy(() => import('../components/FAQ'));

// Minimal fallback — invisible placeholder that reserves no height
const Noop = () => null;

/**
 * Full homepage section flow.
 * Theme-aware shell: dark = cinematic; light = bright surfaces + dark text.
 */
export default function Home() {
  const { theme } = useTheme();
  const { user, isStaff, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const light = theme === 'light';

  useEffect(() => {
    // If a user is already logged in, skip the marketing page and send them to their dashboard
    if (user && !loading && !profileLoading) {
      navigate(isStaff ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, isStaff, loading, profileLoading, navigate]);

  return (
    <div
      className={`landing-home ${light ? 'landing-home-light' : 'landing-home-dark'}`}
      data-home-theme={theme}
    >
      {/* Above-fold: loaded eagerly for fastest LCP */}
      <Hero />

      <section
        className={`relative z-20 -mt-4 sm:-mt-10 px-3 xs:px-4 sm:px-6 pb-10 sm:pb-14 ${
          light
            ? 'bg-gradient-to-b from-white via-slate-50 to-slate-100'
            : 'bg-gradient-to-b from-[#0B0D12] via-[#0E1117] to-[#12151C]'
        }`}
      >
        <div className="max-w-3xl mx-auto w-full min-w-0">
          <ChoiceFinder embedded />
        </div>
      </section>

      {/* Below-fold: lazy-loaded after hero paints */}
      <Suspense fallback={<Noop />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<Noop />}>
        <MbbsWalaTools />
      </Suspense>

      <Suspense fallback={<Noop />}>
        <PainPoints />
      </Suspense>

      <Suspense fallback={<Noop />}>
        <Explainer />
      </Suspense>

      <Suspense fallback={<Noop />}>
        <Features />
      </Suspense>

      <section
        className={`py-16 sm:py-20 md:py-24 px-4 sm:px-6 ${
          light ? 'bg-slate-50' : 'bg-[#12151C]'
        }`}
      >
        <div className="text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F97316] mb-3">
            Packages
          </p>
          <h2
            className={`font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 ${
              light ? 'text-slate-900' : 'text-white'
            }`}
          >
            Big on data.
            <br />
            <span className={light ? 'text-slate-700' : 'text-white/90'}>Light on your pocket.</span>
          </h2>
          <p className={`font-medium ${light ? 'text-slate-600' : 'text-white/55'}`}>
            Clear counselling plans for every exam — no hidden charges.
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <Suspense fallback={<Noop />}>
            <PackagesGrid />
          </Suspense>
          <div className="text-center mt-10">
            <Link
              to="/packages"
              className={light ? 'zn-cta zn-cta-primary inline-flex' : 'zn-cta-ghost inline-flex'}
            >
              View all packages
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<Noop />}>
        <Support />
      </Suspense>

      <Suspense fallback={<Noop />}>
        <AppPromo />
      </Suspense>

      <Suspense fallback={<Noop />}>
        <Testimonials />
      </Suspense>

      <Suspense fallback={<Noop />}>
        <FAQ />
      </Suspense>

      {/* Special ₹99 Counselling Pack Offer Banner Popup */}
      <PromoBannerPopup />
    </div>
  );
}
