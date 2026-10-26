import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, CheckCircle2, ArrowRight, Flame, ShieldCheck, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function PromoBannerPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('mbbs_banner_dismissed') === '1';
  });
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  useEffect(() => {
    // Show banner popup smoothly after initial page load if not previously dismissed
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isDismissed]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsOpen(false);
    setIsDismissed(true);
    sessionStorage.setItem('mbbs_banner_dismissed', '1');
  };

  const handleClaim = () => {
    // Set banner redirect flag for login flow
    sessionStorage.setItem('mbbs_banner_redirect', '/dashboard/subscription');

    if (user) {
      // User is already logged in, redirect straight to subscription
      navigate('/dashboard/subscription');
    } else {
      // User needs to login/signup first, navigate to login with banner query
      navigate('/login?from=banner_99&redirect=/dashboard/subscription', {
        state: { from: '/dashboard/subscription', fromBanner: true },
      });
    }
    setIsOpen(false);
  };

  const handleReopen = () => {
    setIsDismissed(false);
    sessionStorage.removeItem('mbbs_banner_dismissed');
    setIsOpen(true);
  };

  return (
    <>
      {/* Minimized floating pill when dismissed so user can easily reopen the offer */}
      {isDismissed && !isOpen && (
        <motion.button
          type="button"
          onClick={handleReopen}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-20 left-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full shadow-xl font-bold text-xs cursor-pointer border transition-all duration-200 bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/40 hover:shadow-orange-500/25"
          aria-label="Reopen ₹99 pack offer"
        >
          <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
          <Tag className="w-3.5 h-3.5" />
          <span>Pack Starts at ₹99</span>
        </motion.button>
      )}

      {/* Main Banner Popup Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 sm:p-6 overflow-x-hidden">
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => handleClose()}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Popup Card */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.94 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border ${
                isLight
                  ? 'bg-white text-slate-900 border-orange-500/30 shadow-orange-500/10'
                  : 'bg-[#10141D] text-white border-orange-500/30 shadow-[0_20px_60px_-15px_rgba(249,115,22,0.25)]'
              }`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="promo-banner-title"
            >
              {/* Glowing decorative background aura */}
              <div
                className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-orange-500/20 blur-3xl pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className={`absolute top-3.5 right-3.5 z-20 p-2 rounded-full transition-colors ${
                  isLight
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Close offer banner"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative p-6 sm:p-7">
                {/* Header Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-500 border border-orange-500/30">
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
                    <span>Special Limited Offer</span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <Sparkles className="w-3 h-3" />
                    <span>Instant Access</span>
                  </div>
                </div>

                {/* Main Headline */}
                <h3
                  id="promo-banner-title"
                  className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug mb-2"
                >
                  Our Medical Counselling Pack Starts at{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400">
                    Just Only ₹99!
                  </span>
                </h3>

                <p className={`text-sm mb-4 font-medium leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Get verified MCC AIQ + State Quota cutoffs, AI choice filling sequence, and college predictors for MBBS, BDS & AYUSH.
                </p>

                {/* Price Display Box */}
                <div
                  className={`p-4 rounded-2xl mb-4 border flex items-center justify-between gap-4 ${
                    isLight
                      ? 'bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-orange-50/30 border-orange-200/80'
                      : 'bg-gradient-to-r from-orange-950/30 via-slate-900 to-amber-950/20 border-orange-500/25'
                  }`}
                >
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-orange-500 block">
                      Starter Guidance Pack
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-orange-500">
                        ₹99
                      </span>
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        ₹999
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        90% OFF
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 block">Validity</span>
                    <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      Full 2025 Season
                    </span>
                  </div>
                </div>

                {/* Feature Highlights */}
                <ul className="space-y-2 mb-5">
                  {[
                    '15 College Predictions with Live Cutoff Trends',
                    'MCC AIQ + All 28 State Quota Round-wise Matrices',
                    'AI Smart Choice Preference Order Sequence',
                    'Closing Rank Analytics & Official Fee Structure',
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className={isLight ? 'text-slate-700' : 'text-slate-200'}>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Action CTA Button */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleClaim}
                    className="w-full relative group overflow-hidden rounded-xl py-3.5 px-5 font-bold text-sm sm:text-base text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:via-amber-600 hover:to-orange-600 active:scale-[0.98] shadow-orange-500/30"
                  >
                    <span>Claim Your Pack at Just ₹99</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    {/* Shimmer light effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      100% Verified NEET Data
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="hover:underline text-slate-400 hover:text-slate-500 cursor-pointer"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
