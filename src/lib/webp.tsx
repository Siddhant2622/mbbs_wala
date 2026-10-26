/**
 * Converts an image path to its .webp equivalent.
 * e.g. /images/india/college-1.jpg  →  /images/india/college-1.webp
 * Falls back gracefully if the .webp doesn't exist (browser uses original src).
 */
export function toWebP(src: string): string {
  if (!src) return src;
  // Already WebP or SVG — return as-is
  if (src.endsWith('.webp') || src.endsWith('.svg')) return src;
  // External URL — can't serve from our CDN
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}

type PictureImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** The original JPG/PNG src — WebP will be auto-derived */
  src: string;
  alt: string;
};

/**
 * Drop-in replacement for <img> that automatically serves WebP
 * to browsers that support it, with the original as fallback.
 *
 * Usage:
 *   <WebPImg src="/images/india/college-1.jpg" alt="College" className="..." />
 */
export function WebPImg({ src, alt, ...rest }: PictureImgProps) {
  const webpSrc = toWebP(src);
  const isAlreadyWebP = webpSrc === src;

  if (isAlreadyWebP) {
    return <img src={src} alt={alt} {...rest} />;
  }

  return (
    <picture style={{ display: 'contents' }}>
      <source srcSet={webpSrc} type="image/webp" />
      <img src={src} alt={alt} {...rest} />
    </picture>
  );
}
