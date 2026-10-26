/**
 * Compress ALL actively-used images to WebP.
 * Skips files that already have a .webp sibling.
 * Run: node scripts/compress-all-images.mjs
 */
import sharp from 'sharp';
import { existsSync, statSync } from 'fs';
import { resolve, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

// All actively-used images found in src/ + index.html
// Each entry: { src, width, quality }
// width: max display width (to avoid over-serving pixels)
// quality: WebP quality (85 is visually lossless; lower for hero/bg)
const images = [
  // ── india/ ──────────────────────────────────────────────────────────────
  { src: 'images/india/college-1.jpg',      width: 1280, quality: 80 },
  { src: 'images/india/college-2.jpg',      width: 1280, quality: 80 },
  { src: 'images/india/counsel-meet.jpg',   width: 800,  quality: 82 },
  { src: 'images/india/doctor.jpg',         width: 800,  quality: 82 },
  { src: 'images/india/doctors-group.jpg',  width: 800,  quality: 82 },
  { src: 'images/india/family-consult.jpg', width: 800,  quality: 82 },
  { src: 'images/india/gmc.jpg',            width: 1280, quality: 80 },
  { src: 'images/india/students.jpg',       width: 800,  quality: 82 },

  // ── mbbswala/ — avatars ─────────────────────────────────────────────────
  { src: 'images/mbbswala/avatar-1.jpg', width: 120, quality: 85 },
  { src: 'images/mbbswala/avatar-2.jpg', width: 120, quality: 85 },
  { src: 'images/mbbswala/avatar-3.jpg', width: 120, quality: 85 },
  { src: 'images/mbbswala/avatar-4.jpg', width: 120, quality: 85 },
  { src: 'images/mbbswala/avatar-5.jpg', width: 120, quality: 85 },

  // ── mbbswala/ — dashboard/feature screenshots ──────────────────────────
  { src: 'images/mbbswala/dash-insights.png',      width: 1200, quality: 82 },
  { src: 'images/mbbswala/feat-01-notify.jpg',     width: 800,  quality: 82 },
  { src: 'images/mbbswala/feat-02-data.jpg',       width: 800,  quality: 82 },
  { src: 'images/mbbswala/feat-04-docs.jpg',       width: 800,  quality: 82 },
  { src: 'images/mbbswala/feat-05-map.jpg',        width: 800,  quality: 82 },
  { src: 'images/mbbswala/feat-07-list.jpg',       width: 800,  quality: 82 },
  { src: 'images/mbbswala/feature-college.jpg',    width: 800,  quality: 82 },
  { src: 'images/mbbswala/feature-counsel.jpg',    width: 800,  quality: 82 },

  // ── mbbswala/ — hero & background ──────────────────────────────────────
  { src: 'images/mbbswala/hero-main.jpg', width: 1280, quality: 78 },
  { src: 'images/mbbswala/hero-warm.jpg', width: 1280, quality: 75 },

  // ── mbbswala/ — india duplicates (used via /images/mbbswala/india-*.jpg)
  { src: 'images/mbbswala/india-college-1.jpg',    width: 1280, quality: 80 },
  { src: 'images/mbbswala/india-college-2.jpg',    width: 1280, quality: 80 },
  { src: 'images/mbbswala/india-counsel-meet.jpg', width: 800,  quality: 82 },
  { src: 'images/mbbswala/india-doctor.jpg',       width: 800,  quality: 82 },
  { src: 'images/mbbswala/india-doctors-group.jpg',width: 800,  quality: 82 },
  { src: 'images/mbbswala/india-family-consult.jpg',width: 800, quality: 82 },
  { src: 'images/mbbswala/india-gmc.jpg',          width: 1280, quality: 80 },
  { src: 'images/mbbswala/india-students.jpg',     width: 800,  quality: 82 },

  // ── mbbswala/ — login hero ─────────────────────────────────────────────
  { src: 'images/mbbswala/login-3d-hero.png', width: 1200, quality: 82 },

  // ── mbbswala/ — logos (PNG → WebP is huge saving for transparent PNGs) ─
  { src: 'images/mbbswala/logo.png',            width: 600,  quality: 88 },
  { src: 'images/mbbswala/logo-icon-clean.png', width: 128,  quality: 90 },
  { src: 'images/mbbswala/logo-master.png',     width: 600,  quality: 88 },
  { src: 'images/mbbswala/logo-nav.png',        width: 300,  quality: 88 },

  // ── mbbswala/ — 3D objects ─────────────────────────────────────────────
  { src: 'images/mbbswala/obj-clipboard.png',   width: 600,  quality: 85 },
  { src: 'images/mbbswala/obj-cross.png',       width: 600,  quality: 85 },
  { src: 'images/mbbswala/obj-heart.png',       width: 600,  quality: 85 },
  { src: 'images/mbbswala/obj-kit.png',         width: 600,  quality: 85 },
  { src: 'images/mbbswala/obj-stethoscope.png', width: 600,  quality: 85 },

  // ── mbbswala/ — packages ───────────────────────────────────────────────
  { src: 'images/mbbswala/pkg-dental.jpg', width: 400, quality: 85 },
  { src: 'images/mbbswala/pkg-heart.jpg',  width: 400, quality: 85 },
  { src: 'images/mbbswala/pkg-steth.jpg',  width: 400, quality: 85 },

  // ── mbbswala/ — tools ──────────────────────────────────────────────────
  { src: 'images/mbbswala/tools-college.jpg', width: 800, quality: 82 },
  { src: 'images/mbbswala/tools-data.jpg',    width: 800, quality: 82 },
];

let totalOriginal = 0;
let totalCompressed = 0;
let skipped = 0;
let failed = 0;

console.log(`\n🔄 Compressing ${images.length} images to WebP...\n`);

for (const img of images) {
  const srcPath = resolve(publicDir, img.src);
  if (!existsSync(srcPath)) {
    console.warn(`  ⚠ Not found: ${img.src}`);
    failed++;
    continue;
  }

  const ext = extname(img.src);
  const destPath = srcPath.replace(new RegExp(`\\${ext}$`), '.webp');

  // Skip if WebP already exists and is newer than source
  if (existsSync(destPath)) {
    const srcMtime = statSync(srcPath).mtimeMs;
    const destMtime = statSync(destPath).mtimeMs;
    if (destMtime >= srcMtime) {
      skipped++;
      continue;
    }
  }

  try {
    const srcSize = statSync(srcPath).size;
    await sharp(srcPath)
      .resize({ width: img.width, withoutEnlargement: true })
      .webp({ quality: img.quality, effort: 5 })
      .toFile(destPath);

    const destSize = statSync(destPath).size;
    totalOriginal += srcSize;
    totalCompressed += destSize;

    const pct = Math.round((1 - destSize / srcSize) * 100);
    const label = pct > 0 ? `${pct}% smaller` : 'larger (already optimized)';
    console.log(`  ✅ ${img.src.padEnd(50)} ${Math.round(srcSize/1024)}KB → ${Math.round(destSize/1024)}KB  (${label})`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${img.src} — ${err.message}`);
    failed++;
  }
}

const savedKB = Math.round((totalOriginal - totalCompressed) / 1024);
const savedPct = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

console.log(`\n${'─'.repeat(70)}`);
console.log(`✅ Compressed: ${images.length - failed - skipped}  ⏭ Skipped (up-to-date): ${skipped}  ✗ Failed: ${failed}`);
if (totalOriginal > 0) {
  console.log(`💾 Total saved: ${savedKB} KB  (${savedPct}% reduction)`);
  console.log(`   Original: ${Math.round(totalOriginal/1024)} KB  →  Compressed: ${Math.round(totalCompressed/1024)} KB`);
}
console.log('');
