import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ui/ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

const tools = [
  { name: 'Rank → colleges', path: '/rank-calculator' },
  { name: 'Compare colleges', path: '/compare' },
  { name: 'Colleges', path: '/colleges' },
  { name: 'Seat matrix', path: '/seat-matrix' },
  { name: 'Cut-offs', path: '/cutoffs' },
  { name: 'Packages', path: '/packages' },
  { name: 'Blogs', path: '/blogs' },
];

const counsellings = [
  { name: 'MBBS', path: '/neet-ug' },
  { name: 'BDS', path: '/bds' },
  { name: 'BAMS', path: '/bams' },
  { name: 'BHMS', path: '/bhms' },
  { name: 'BUMS / BSMS / BNYS', path: '/ayush-combo' },
  { name: 'NEET PG', path: '/neet-pg' },
  { name: 'NEET MDS', path: '/neet-mds' },
  { name: 'INICET', path: '/inicet' },
];

const company = [
  { name: 'About us', path: '/about-us' },
  { name: 'Testimonials', path: '/testimonials' },
  { name: 'Careers', path: '/careers' },
  { name: 'Staff & Counsellor Login', path: '/admin/login' },
];

type MenuKey = 'tools' | 'counselling' | 'company' | null;

export default function Navbar() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MenuKey>(null);
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const latest = window.scrollY;
          if (latest < 50) {
            setIsVisible(true);
          } else if (latest > lastY && latest > 50) {
            setIsVisible(false); // scrolling down
          } else if (latest < lastY) {
            setIsVisible(true); // scrolling up
          }
          lastY = latest;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setMobileSection(null);
  }, [location.pathname]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.documentElement.classList.add('scroll-lock');
    } else {
      document.documentElement.classList.remove('scroll-lock');
    }
    return () => {
      document.documentElement.classList.remove('scroll-lock');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileOpen]);

  const visibilityClass = `transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`;

  const shellClass = isLight
    ? `fixed top-0 left-0 right-0 w-full z-[99] pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3 px-3 sm:px-5 bg-white/90 backdrop-blur-xl border-b border-black/8 ${visibilityClass}`
    : `fixed top-0 left-0 right-0 w-full z-[99] pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3 px-3 sm:px-5 bg-[#12151C]/94 backdrop-blur-xl border-b border-white/8 ${visibilityClass}`;

  const linkCls = isLight
    ? 'px-3 py-2 text-[13px] xl:text-[14px] font-semibold text-slate-700 hover:text-black rounded-full hover:bg-black/[0.05] transition-colors'
    : 'px-3 py-2 text-[13px] xl:text-[14px] font-semibold text-white/75 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors';

  const dropBtnCls = isLight
    ? 'flex items-center gap-1 px-3 py-2 text-[13px] xl:text-[14px] font-semibold text-slate-700 hover:text-black rounded-full hover:bg-black/[0.05] transition-colors touch-manipulation'
    : 'flex items-center gap-1 px-3 py-2 text-[13px] xl:text-[14px] font-semibold text-white/75 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors touch-manipulation';

  const dropPanelCls = isLight
    ? 'absolute top-12 left-1/2 -translate-x-1/2 bg-white border border-black/10 rounded-2xl p-1.5 z-50 min-w-[220px] max-w-[min(280px,90vw)] shadow-[0_20px_50px_rgba(15,23,42,0.12)]'
    : 'absolute top-12 left-1/2 -translate-x-1/2 bg-[#1A1E28] border border-white/10 rounded-2xl p-1.5 z-50 min-w-[220px] max-w-[min(280px,90vw)] shadow-[0_20px_50px_rgba(0,0,0,0.45)]';

  const dropItemCls = isLight
    ? 'block px-4 py-2.5 rounded-xl hover:bg-black/[0.04] font-semibold text-sm text-slate-800'
    : 'block px-4 py-2.5 rounded-xl hover:bg-white/[0.06] font-semibold text-sm text-white/90';

  const DesktopDropdown = ({
    id,
    label,
    items,
  }: {
    id: Exclude<MenuKey, null>;
    label: string;
    items: { name: string; path: string }[];
  }) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpenMenu((v) => (v === id ? null : id))}
        className={dropBtnCls}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${openMenu === id ? 'rotate-180' : ''}`}
        />
      </button>
      {openMenu === id && (
        <div className={dropPanelCls}>
          {items.map((item) => (
            <Link key={item.path} to={item.path} className={dropItemCls}>
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const toggleMobileSection = (key: Exclude<MenuKey, null>) => {
    setMobileSection((s) => (s === key ? null : key));
  };

  return (
    <>
      <div className="h-[76px] sm:h-[84px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
      <div className={shellClass}>
        <nav
        ref={navRef}
        className={
          isLight
            ? 'pointer-events-auto relative max-w-[1040px] mx-auto rounded-full bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(15,23,42,0.08)] border border-black/8'
            : 'pointer-events-auto relative max-w-[1040px] mx-auto rounded-full bg-[#141820]/92 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] border border-white/[0.08]'
        }
      >
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2">
          <BrandLogo size="sm" onDark={!isLight} className="shrink-0 pl-1" />

          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center min-w-0">
            <Link to="/colleges" className={linkCls}>
              Colleges
            </Link>
            <DesktopDropdown id="counselling" label="Counselling" items={counsellings} />
            <DesktopDropdown id="tools" label="Tools" items={tools} />
            <Link to="/packages" className={linkCls}>
              Packages
            </Link>
            <DesktopDropdown id="company" label="About" items={company} />
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Link
              to="/login"
              onClick={() => sessionStorage.removeItem('mbbs_banner_redirect')}
              className="btn-orange px-5 py-2.5 text-sm touch-manipulation"
            >
              Login
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <ThemeToggle />
            <Link
              to="/login"
              onClick={() => sessionStorage.removeItem('mbbs_banner_redirect')}
              className="btn-orange px-3.5 py-2 text-xs sm:text-sm touch-manipulation"
            >
              Login
            </Link>
            <button
              type="button"
              className={
                isLight
                  ? 'flex items-center justify-center w-10 h-10 rounded-full border border-black/10 bg-black/[0.04] touch-manipulation'
                  : 'flex items-center justify-center w-10 h-10 rounded-full border border-white/12 bg-white/5 touch-manipulation'
              }
              onClick={() => {
                setMobileOpen((v) => !v);
                setMobileSection(null);
              }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className={`w-5 h-5 ${isLight ? 'text-slate-900' : 'text-white'}`} />
              ) : (
                <span className="flex flex-col gap-1.5 w-4">
                  <span className={`block h-0.5 w-full rounded ${isLight ? 'bg-slate-900' : 'bg-white'}`} />
                  <span className={`block h-0.5 w-full rounded ${isLight ? 'bg-slate-900' : 'bg-white'}`} />
                  <span className={`block h-0.5 w-full rounded ${isLight ? 'bg-slate-900' : 'bg-white'}`} />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile panel — accordion sections like desktop */}
        {mobileOpen && (
          <div
            className={
              isLight
                ? 'md:hidden absolute left-0 right-0 top-[calc(100%+10px)] bg-white text-slate-900 rounded-3xl shadow-2xl z-50 overflow-hidden border border-black/10 max-h-[min(78vh,580px)] overflow-y-auto zn-scroll'
                : 'md:hidden absolute left-0 right-0 top-[calc(100%+10px)] bg-[#0E1117] text-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-white/10 max-h-[min(78vh,580px)] overflow-y-auto zn-scroll'
            }
            data-lenis-prevent
          >
            <Link
              to="/colleges"
              className={
                isLight
                  ? 'block px-5 py-3.5 font-semibold border-b border-black/8 hover:bg-black/[0.04] touch-manipulation'
                  : 'block px-5 py-3.5 font-semibold border-b border-white/8 hover:bg-white/5 touch-manipulation'
              }
            >
              Colleges
            </Link>
            <Link
              to="/packages"
              className={
                isLight
                  ? 'block px-5 py-3.5 font-semibold border-b border-black/8 hover:bg-black/[0.04] touch-manipulation'
                  : 'block px-5 py-3.5 font-semibold border-b border-white/8 hover:bg-white/5 touch-manipulation'
              }
            >
              Packages
            </Link>

            {(
              [
                { key: 'counselling' as const, label: 'Counselling', items: counsellings },
                { key: 'tools' as const, label: 'Tools', items: tools },
                { key: 'company' as const, label: 'About', items: company },
              ] as const
            ).map((sec) => {
              const open = mobileSection === sec.key;
              return (
                <div key={sec.key} className={isLight ? 'border-b border-black/8' : 'border-b border-white/8'}>
                  <button
                    type="button"
                    className={
                      isLight
                        ? 'w-full flex items-center justify-between px-5 py-3.5 font-semibold touch-manipulation hover:bg-black/[0.04]'
                        : 'w-full flex items-center justify-between px-5 py-3.5 font-semibold touch-manipulation hover:bg-white/5'
                    }
                    onClick={() => toggleMobileSection(sec.key)}
                    aria-expanded={open}
                  >
                    {sec.label}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                      } ${isLight ? 'text-slate-500' : 'text-white/60'}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-250 ease-out ${
                      open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-3 pb-3 space-y-0.5">
                      {sec.items.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={
                            isLight
                              ? 'block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 touch-manipulation'
                              : 'block px-4 py-2.5 rounded-xl text-sm font-medium text-white/80 bg-white/[0.04] hover:bg-white/[0.08] touch-manipulation'
                          }
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Link
                to="/login"
                className="btn-orange w-full py-3 text-sm text-center block touch-manipulation"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </nav>
      </div>
    </>
  );
}
