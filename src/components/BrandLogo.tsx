import { Link } from 'react-router-dom';

type Props = {
  to?: string | null;
  className?: string;
  imgClassName?: string;
  /** Dark UI surfaces (nav/footer/sidebar) */
  onDark?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Icon mark only */
  markOnly?: boolean;
};

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-9 sm:h-10 max-h-10 w-auto max-w-[150px] sm:max-w-[180px]',
  md: 'h-11 sm:h-12 max-h-12 w-auto max-w-[190px] sm:max-w-[230px]',
  lg: 'h-14 sm:h-16 max-h-16 w-auto max-w-[240px] sm:max-w-[300px]',
  xl: 'h-16 sm:h-20 max-h-20 w-auto max-w-[300px] sm:max-w-[360px]',
};

const markSize: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-16 w-16',
};

/**
 * Official MBBS WAALA logo — stethoscope + MBBS / WAALA wordmark.
 * Uses true transparent PNG (no gray plate).
 */
export default function BrandLogo({
  to = '/',
  className = '',
  imgClassName = '',
  onDark = false,
  size = 'md',
  markOnly = false,
}: Props) {
  // WebP versions for optimized delivery (~10x smaller than PNG)
  const webpSrc = markOnly
    ? undefined // no WebP mark yet, use PNG
    : size === 'sm'
      ? '/images/mbbswala/logo-master-sm.webp'
      : '/images/mbbswala/logo-master.webp';

  const primarySrc = markOnly
    ? '/images/mbbswala/icon.png'
    : '/images/mbbswala/logo-master.png';

  const fallbackSrc = markOnly
    ? '/images/mbbswala/logo-icon-clean.png'
    : '/images/mbbswala/logo-nav.png';

  const svgFallback = markOnly
    ? '/images/mbbswala/brand-mark.svg'
    : onDark
      ? '/images/mbbswala/brand-logo-on-dark.svg'
      : '/images/mbbswala/brand-logo.svg';

  const imgEl = (
    <img
      src={`${primarySrc}?v=3`}
      alt="MBBS WAALA"
      className={`brand-logo block object-contain bg-transparent border-0 shadow-none ${
        markOnly
          ? `${markSize[size]} object-center !max-w-none`
          : `${sizeClass[size]} object-left`
      } ${imgClassName}`}
      style={{
        background: 'transparent',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        // No brightness filters — they create a washed gray plate
        filter: 'none',
      }}
      width={markOnly ? 48 : 240}
      height={markOnly ? 48 : 64}
      decoding="async"
      draggable={false}
      onError={(e) => {
        const el = e.currentTarget;
        const step = Number(el.dataset.step || '0');
        if (step === 0) {
          el.dataset.step = '1';
          el.src = `${fallbackSrc}?v=3`;
          return;
        }
        if (step === 1) {
          el.dataset.step = '2';
          el.src = svgFallback;
          return;
        }
        el.style.display = 'none';
        const sib = el.nextElementSibling as HTMLElement | null;
        if (sib) sib.hidden = false;
      }}
    />
  );

  const img = (
    <span
      className={`inline-flex items-center justify-center min-w-0 shrink-0 bg-transparent p-0 m-0 border-0 shadow-none ${className}`}
      style={{ background: 'transparent', boxShadow: 'none' }}
    >
      {webpSrc && !markOnly ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          {imgEl}
        </picture>
      ) : imgEl}
      <span
        hidden
        className={`font-black tracking-tight leading-none select-none whitespace-nowrap ${
          size === 'sm' ? 'text-sm' : size === 'lg' || size === 'xl' ? 'text-xl' : 'text-base'
        }`}
      >
        <span className={onDark ? 'text-[#64B5F6]' : 'text-[#1E88E5]'}>MBBS</span>
        <span className={onDark ? 'text-[#FF80AB]' : 'text-[#EC407A]'}> WAALA</span>
      </span>
    </span>
  );

  if (to === undefined || to === null || to === '') return img;

  return (
    <Link
      to={to}
      className="inline-flex items-center shrink-0 bg-transparent p-0 m-0 border-0 shadow-none hover:opacity-95 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E88E5]/35 rounded-md"
      style={{ background: 'transparent', boxShadow: 'none' }}
      aria-label="MBBS WAALA home"
    >
      {img}
    </Link>
  );
}
